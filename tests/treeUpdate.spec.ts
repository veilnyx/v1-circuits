import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { randomBigInt } from '@veilnyx-sdk/utils';
import {
  getCircuit,
  getInitialTreeState,
  insertLeaves,
  zeroElement,
  sha256Fields,
  MSG_ASSERT_FAILED,
  MerkleTreeState,
} from './helpers';

chai.use(chaiAsPromised);

const treeDepth = 32;
const batchSize = 10;

const randomLeaf = () => randomBigInt(31);

// Inputs exactly as the contract binds them: leafIndex, leaves (padded), lastRoot,
// newRoot and nZeroLeaves are hashed into inputsHash; lastSubtrees stays private.
const buildInputs = (ts1: MerkleTreeState, realLeaves: bigint[]) => {
  const nZeroLeaves = batchSize - realLeaves.length;
  const leaves = [...realLeaves, ...Array.from({ length: nZeroLeaves }).map(() => zeroElement)];
  const ts2 = insertLeaves(ts1, realLeaves);
  const leafIndex = ts1.nextLeafIndex;
  return {
    inputs: {
      inputsHash: sha256Fields([leafIndex, ...leaves, ts1.root, ts2.root, nZeroLeaves]),
      leafIndex,
      leaves,
      lastRoot: ts1.root,
      lastSubtrees: ts1.subtrees,
      newRoot: ts2.root,
      nZeroLeaves,
    },
    ts2,
  };
};

const rehash = (inputs: ReturnType<typeof buildInputs>['inputs']) => ({
  ...inputs,
  inputsHash: sha256Fields([
    inputs.leafIndex,
    ...inputs.leaves,
    inputs.lastRoot,
    inputs.newRoot,
    inputs.nZeroLeaves,
  ]),
});

describe('treeUpdate', function () {
  this.timeout(120000);
  let insertLeafCircuit;
  let updateTreeCircuit;

  before(async function () {
    insertLeafCircuit = await getCircuit('insertLeaf');
    updateTreeCircuit = await getCircuit('treeUpdate');
  });

  // 10 leaves already in: leafIndex = 10 = 0b1010, so levels 1 and 3 read lastSubtrees
  const tenLeaves = () =>
    insertLeaves(getInitialTreeState(treeDepth), Array.from({ length: 10 }).map(() => randomLeaf()));

  it('should correctly insert leaf', async function () {
    const ts1 = tenLeaves();
    const leaf = randomLeaf();
    const ts2 = insertLeaves(ts1, [leaf]);

    const witness = await insertLeafCircuit.calculateWitness({
      leaf,
      leafIndex: ts1.nextLeafIndex,
      lastRoot: ts1.root,
      lastSubtrees: ts1.subtrees,
    });

    expect(witness[1]).to.equal(ts2.root);
    for (let i = 0; i < ts2.subtrees.length; i++) {
      expect(witness[2 + i]).to.equal(ts2.subtrees[i]);
    }
  });

  [0, 2, 3].forEach((nZero) => {
    it(`should correctly insert a batch with ${nZero} padding leaves`, async function () {
      const { inputs } = buildInputs(
        tenLeaves(),
        Array.from({ length: batchSize - nZero }).map(() => randomLeaf()),
      );
      const witness = await updateTreeCircuit.calculateWitness(inputs, true);
      await updateTreeCircuit.checkConstraints(witness);
    });
  });

  it('should insert into an empty tree (leafIndex 0)', async function () {
    const { inputs } = buildInputs(getInitialTreeState(treeDepth), [randomLeaf(), randomLeaf()]);
    await assert.isFulfilled(updateTreeCircuit.calculateWitness(inputs, true));
  });

  describe('frontier binding (lastSubtrees is private)', function () {
    [1, 3].forEach((level) => {
      it(`rejects a wrong subtree at level ${level} (bit set in leafIndex)`, async function () {
        const { inputs } = buildInputs(tenLeaves(), [randomLeaf()]);
        const lastSubtrees = [...inputs.lastSubtrees];
        lastSubtrees[level] = lastSubtrees[level] + 1n;
        await assert.isRejected(
          updateTreeCircuit.calculateWitness({ ...inputs, lastSubtrees }, true),
          MSG_ASSERT_FAILED,
        );
      });
    });

    it('ignores subtrees at levels whose bit is 0 (they are overwritten before use)', async function () {
      const { inputs } = buildInputs(tenLeaves(), Array.from({ length: batchSize }).map(() => randomLeaf()));
      const lastSubtrees = [...inputs.lastSubtrees];
      lastSubtrees[0] = randomLeaf();
      lastSubtrees[2] = randomLeaf();
      // newRoot is still the honest one, bound by inputsHash
      await assert.isFulfilled(updateTreeCircuit.calculateWitness({ ...inputs, lastSubtrees }, true));
    });

    it('rejects a forged frontier that tries to graft a different history', async function () {
      // The attack the frontier check stops: newRoot comes from calldata, so without it a
      // prover could take the frontier of ANOTHER tree (e.g. one holding a fake note),
      // insert the queued leaves on top and submit the resulting root.
      const ts1 = tenLeaves(); // the pool's real tree (lastRoot from storage)
      const other = tenLeaves(); // attacker's tree, same leafIndex
      const leaves = [randomLeaf()];
      const forged = insertLeaves(other, leaves);
      const { inputs } = buildInputs(ts1, leaves);
      await assert.isRejected(
        updateTreeCircuit.calculateWitness(
          rehash({ ...inputs, lastSubtrees: other.subtrees, newRoot: forged.root }),
          true,
        ),
        MSG_ASSERT_FAILED,
      );
    });
  });

  describe('inputsHash binding', function () {
    it('rejects a forged newRoot even when inputsHash is recomputed over it', async function () {
      const { inputs } = buildInputs(tenLeaves(), [randomLeaf()]);
      await assert.isRejected(
        updateTreeCircuit.calculateWitness(rehash({ ...inputs, newRoot: inputs.newRoot + 1n }), true),
        MSG_ASSERT_FAILED,
      );
    });

    const tamper: Record<string, (i: any) => any> = {
      leafIndex: (i) => ({ inputsHash: sha256Fields([i.leafIndex + 1, ...i.leaves, i.lastRoot, i.newRoot, i.nZeroLeaves]) }),
      leaf: (i) => ({ inputsHash: sha256Fields([i.leafIndex, i.leaves[0] + 1n, ...i.leaves.slice(1), i.lastRoot, i.newRoot, i.nZeroLeaves]) }),
      lastRoot: (i) => ({ inputsHash: sha256Fields([i.leafIndex, ...i.leaves, i.lastRoot + 1n, i.newRoot, i.nZeroLeaves]) }),
      newRoot: (i) => ({ inputsHash: sha256Fields([i.leafIndex, ...i.leaves, i.lastRoot, i.newRoot + 1n, i.nZeroLeaves]) }),
      nZeroLeaves: (i) => ({ inputsHash: sha256Fields([i.leafIndex, ...i.leaves, i.lastRoot, i.newRoot, i.nZeroLeaves + 1]) }),
    };
    Object.entries(tamper).forEach(([field, f]) => {
      it(`rejects an inputsHash computed over a different ${field}`, async function () {
        const { inputs } = buildInputs(tenLeaves(), [randomLeaf(), randomLeaf()]);
        await assert.isRejected(
          updateTreeCircuit.calculateWitness({ ...inputs, ...f(inputs) }, true),
          MSG_ASSERT_FAILED,
        );
      });
    });
  });
});
