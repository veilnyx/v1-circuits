import { assert } from 'chai';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { MerkleTree } from 'fixed-merkle-tree';
import { getCircuit, randomHex } from './helpers';

const getTree = () => new MerkleTree(20, [], { hashFunction: (a, b) => poseidonHash([a, b]) });
const randomLeaf = () => poseidonHash(randomHex(32));

describe('merkleProof', function () {
  this.timeout(8000);
  let circuit;

  before(async function () {
    circuit = await getCircuit('merkleProof20');
  });

  it('should verify correct inclusion path when enabled', async function () {
    const tree = getTree();
    const leaves = [randomLeaf(), randomLeaf(), randomLeaf(), randomLeaf()];
    tree.bulkInsert(leaves);

    const root = tree.root.toString();

    const proofElement = leaves[1];
    const idx = tree.indexOf(proofElement);

    const pathElements = tree.path(idx).pathElements;

    const inputs = {
      enabled: 1,
      leaf: proofElement,
      pathElements,
      pathIndices: idx,
      root,
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });

  it('should verify with incorrect when disabled', async function () {
    const tree = getTree();
    const leaves = [randomLeaf(), randomLeaf(), randomLeaf(), randomLeaf()];
    tree.bulkInsert(leaves);

    const root = tree.root.toString();
    const badRoot = randomHex(32);
    const proofElement = leaves[1];
    const idx = tree.indexOf(proofElement);
    const pathElements = tree.path(idx).pathElements;

    const inputs = {
      enabled: 0,
      leaf: proofElement,
      pathElements,
      pathIndices: idx,
      root: badRoot,
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });

  it('should fail verification for incorrect inclusion path when enabled', async function () {
    const tree = getTree();
    const leaves = [randomLeaf(), randomLeaf(), randomLeaf()];
    tree.bulkInsert(leaves);

    const root = tree.root.toString();
    const proofElement = leaves[1];
    const badProofElement = 3;
    const idx = tree.indexOf(proofElement);
    const pathElements = tree.path(idx).pathElements;

    const inputs = {
      enabled: 1,
      leaf: badProofElement,
      pathElements,
      pathIndices: idx,
      root,
    };

    await assert.isRejected(circuit.calculateWitness(inputs, true), Error);
  });

  it('should fail verification for incorrect root when enabled', async function () {
    const tree = getTree();
    const leaves = [randomLeaf(), randomLeaf(), randomLeaf()];
    tree.bulkInsert(leaves);

    const root = tree.root.toString();
    const badRoot = randomHex(32);
    const proofElement = leaves[1];
    const badProofElement = 3;
    const idx = tree.indexOf(proofElement);
    const pathElements = tree.path(idx).pathElements;

    const inputs = {
      enabled: 1,
      leaf: badProofElement,
      pathElements,
      pathIndices: idx,
      root: badRoot,
    };

    await assert.isRejected(circuit.calculateWitness(inputs, true), Error);
  });
});
