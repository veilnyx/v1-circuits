import { assert, expect } from 'chai';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { MerkleTree } from 'fixed-merkle-tree';
import { MSG_ASSERT_FAILED, fieldsSize, getCircuit, randomHex } from './helpers';
import { bytesToBigInt, hexToBigInt, keccak256, stringToBytes, toHex } from 'viem';

const treeDepth = 32;
const hashFunction = (a, b) => poseidonHash([a, b]);
const zeroLeaf = hexToBigInt(keccak256(stringToBytes('zkFi'))) % BigInt(fieldsSize);

const getTree = () => new MerkleTree(treeDepth, [], { hashFunction, zeroElement: toHex(zeroLeaf) });
const getLastSubtree = (tree: MerkleTree) => {
  const nLevels = tree.levels;
  const subtree: any[] = [];

  let lastLeafIndex = tree.elements.length - 1;
  for (let i = 0; i < nLevels; i++) {
    if (lastLeafIndex % 2 === 0) {
      subtree[i] = tree.layers[i]?.[lastLeafIndex] || zeroLeaf;
    } else {
      subtree[i] = tree.layers[i]?.[lastLeafIndex - 1] || zeroLeaf;
    }

    lastLeafIndex = Math.floor(lastLeafIndex / 2);
  }

  return subtree.map((el) => BigInt(el));
};

const randomLeaf = () => poseidonHash(randomHex(32));

describe('subtreeUpdate', function () {
  this.timeout(20000);
  let insertLeafCircuit;
  let updateTreeCircuit;

  before(async function () {
    insertLeafCircuit = await getCircuit('insertLeaf');
    updateTreeCircuit = await getCircuit('subtreeUpdate');
  });

  it.only('should correctly insert leaf', async function () {
    const tree = getTree();
    const leaves = Array.from({ length: 10 }).map(() => randomLeaf());
    tree.bulkInsert(leaves);

    const leafIndex = tree.elements.length;
    const lastSubtree = getLastSubtree(tree);
    const lastRoot = BigInt(tree.root.toString());

    const leaf = randomLeaf();

    tree.insert(leaf);
    const newSubtree = getLastSubtree(tree);
    const newRoot = BigInt(tree.root.toString());

    const inputs = {
      leaf,
      leafIndex,
      lastRoot,
      lastSubtree,
    };

    const witness = await insertLeafCircuit.calculateWitness(inputs);

    expect(witness[1]).to.equal(newRoot);
    for (let i = 0; i < newSubtree.length; i++) {
      expect(witness[2 + i]).to.equal(newSubtree[i]);
    }
  });

  it.only('should correctly insert batch of leaves', async function () {
    const tree = getTree();
    const initLeaves = Array.from({ length: 10 }).map(() => randomLeaf());
    tree.bulkInsert(initLeaves);

    const leafIndex = tree.elements.length;
    const lastSubtree = getLastSubtree(tree);
    const lastRoot = BigInt(tree.root.toString());

    const leaves = Array.from({ length: 20 }).map(() => randomLeaf());
    tree.bulkInsert(leaves);

    const newSubtree = getLastSubtree(tree);
    const newRoot = BigInt(tree.root.toString());

    const inputs = {
      leaves,
      leafIndex,
      lastRoot,
      lastSubtree,
      newRoot,
      newSubtree,
    };

    await assert.isFulfilled(updateTreeCircuit.calculateWitness(inputs, true));
    const witness = await updateTreeCircuit.calculateWitness(inputs);
    await updateTreeCircuit.checkConstraints(witness);
  });
});
