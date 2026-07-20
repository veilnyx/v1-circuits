import { expect } from 'chai';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { getCircuit, getInitialTreeState, insertLeaves, zeroElement } from './helpers';

const treeDepth = 32;
const batchSize = 10;

const randomLeaf = () => randomBigInt(31);

describe('treeUpdate', function () {
  this.timeout(20000);
  let insertLeafCircuit;
  let updateTreeCircuit;

  before(async function () {
    insertLeafCircuit = await getCircuit('insertLeaf');
    updateTreeCircuit = await getCircuit('treeUpdate');
  });

  it('should correctly insert leaf', async function () {
    const ts0 = getInitialTreeState(treeDepth);
    const initialLeaves = Array.from({ length: 10 }).map(() => randomLeaf());

    const ts1 = insertLeaves(ts0, initialLeaves);
    const lastSubtrees = ts1.subtrees;
    const lastRoot = ts1.root;
    const leafIndex = ts1.nextLeafIndex;
    const leaf = randomLeaf();

    const ts2 = insertLeaves(ts1, [leaf]);

    const newSubtrees = ts2.subtrees;
    const newRoot = ts2.root;

    const inputs = {
      leaf,
      leafIndex,
      lastRoot,
      lastSubtrees,
    };

    const witness = await insertLeafCircuit.calculateWitness(inputs);

    expect(witness[1]).to.equal(newRoot);
    for (let i = 0; i < newSubtrees.length; i++) {
      expect(witness[2 + i]).to.equal(newSubtrees[i]);
    }
  });

  it('should correctly insert full batch of leaves', async function () {
    const ts0 = getInitialTreeState(treeDepth);
    const initLeaves = Array.from({ length: 10 }).map(() => randomLeaf());
    const ts1 = insertLeaves(ts0, initLeaves);

    const leafIndex = ts1.nextLeafIndex;
    const lastSubtrees = ts1.subtrees;
    const lastRoot = ts1.root;

    const leaves = Array.from({ length: batchSize }).map(() => randomLeaf());
    const ts2 = insertLeaves(ts1, leaves);

    const newSubtrees = ts2.subtrees;
    const newRoot = ts2.root;

    const inputs = {
      leaves,
      leafIndex,
      lastRoot,
      lastSubtrees,
      newRoot,
      newSubtrees,
      nZeroLeaves: 0,
    };

    const witness = await updateTreeCircuit.calculateWitness(inputs, true);
    await updateTreeCircuit.checkConstraints(witness);
  });

  it('should correctly insert partial batch of leaves of even number', async function () {
    const ts0 = getInitialTreeState(treeDepth);
    const initLeaves = Array.from({ length: 10 }).map(() => randomLeaf());
    const ts1 = insertLeaves(ts0, initLeaves);

    const leafIndex = ts1.nextLeafIndex;
    const lastSubtrees = ts1.subtrees;
    const lastRoot = ts1.root;

    const nZeroLeaves = 2;
    const zeroLeaves = Array.from({ length: nZeroLeaves }).map(() => zeroElement);
    const leaves = Array.from({ length: batchSize - nZeroLeaves }).map(() => randomLeaf());
    const ts2 = insertLeaves(ts1, leaves);

    const newSubtrees = ts2.subtrees;
    const newRoot = ts2.root;
    const inputs = {
      leaves: [...leaves, ...zeroLeaves],
      leafIndex,
      lastRoot,
      lastSubtrees,
      newRoot,
      newSubtrees,
      nZeroLeaves,
    };

    const witness = await updateTreeCircuit.calculateWitness(inputs, true);
    await updateTreeCircuit.checkConstraints(witness);
  });

  it('should correctly insert partial batch of leaves of odd number', async function () {
    const ts0 = getInitialTreeState(treeDepth);
    const initLeaves = Array.from({ length: 10 }).map(() => randomLeaf());
    const ts1 = insertLeaves(ts0, initLeaves);

    const leafIndex = ts1.nextLeafIndex;
    const lastSubtrees = ts1.subtrees;
    const lastRoot = ts1.root;

    const nZeroLeaves = 3;
    const zeroLeaves = Array.from({ length: nZeroLeaves }).map(() => zeroElement);
    const leaves = Array.from({ length: batchSize - nZeroLeaves }).map(() => randomLeaf());
    const ts2 = insertLeaves(ts1, leaves);

    const newSubtrees = ts2.subtrees;
    const newRoot = ts2.root;
    const inputs = {
      leaves: [...leaves, ...zeroLeaves],
      leafIndex,
      lastRoot,
      lastSubtrees,
      newRoot,
      newSubtrees,
      nZeroLeaves,
    };

    const witness = await updateTreeCircuit.calculateWitness(inputs, true);
    await updateTreeCircuit.checkConstraints(witness);
  });
});
