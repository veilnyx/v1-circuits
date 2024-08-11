import { assert, expect } from 'chai';
import { hexToBigInt, keccak256, stringToBytes } from 'viem';
import { MerkleTree } from 'fixed-merkle-tree';
import { randomBigInt } from '@zkfi-tech/utils';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { fieldsSize, getCircuit, getMerkleTree, toPaddedHex } from './helpers';

const treeDepth = 32;
const zeroLeaf = hexToBigInt(keccak256(stringToBytes('zero'))) % BigInt(fieldsSize);
const getTree = () => getMerkleTree(treeDepth, [], zeroLeaf);

const getInitialTreeState = () => {
  let z = zeroLeaf;
  const lastSubtree: bigint[] = [];
  const zeros: bigint[] = [];
  for (let i = 0; i < treeDepth; i++) {
    zeros.push(z);
    lastSubtree.push(z);
    z = poseidonHash([z, z]);
  }
  const root = z;

  return { lastSubtree, zeros, root };
};

const getLastSubtree = (tree: MerkleTree) => {
  const zeros = getInitialTreeState().zeros;
  const nLevels = tree.levels;
  const subtree: any[] = [];

  const nextLeafIndex = tree.elements.length;
  let currentLevelIndex = nextLeafIndex - 1;
  currentLevelIndex = Math.floor(currentLevelIndex / 2);

  subtree[0] = zeros[0];
  for (let i = 1; i < nLevels; i++) {
    if (currentLevelIndex % 2 === 0) {
      // Left/Even
      subtree[i] = tree.layers[i]?.[currentLevelIndex] || zeros[i];
    } else {
      // Right/Odd
      subtree[i] = tree.layers[i]?.[currentLevelIndex - 1] || zeros[i];
    }

    currentLevelIndex = Math.floor(currentLevelIndex / 2);
  }

  return subtree.map((el) => BigInt(el));
};

const randomLeaf = () => toPaddedHex(randomBigInt(31));

describe('subtreeUpdate', function () {
  this.timeout(20000);
  let insertLeavesPairCircuit;
  let updateTreeCircuit;

  before(async function () {
    insertLeavesPairCircuit = await getCircuit('insertLeavesPair');
    updateTreeCircuit = await getCircuit('subtreeUpdate');
  });

  it('should correctly insert leaf pairs', async function () {
    const tree = getTree();
    const initialLeaves = Array.from({ length: 10 }).map(() => randomLeaf());
    tree.bulkInsert(initialLeaves);

    const lastSubtree = getLastSubtree(tree);
    const lastRoot = BigInt(tree.root.toString());

    const leafIndex = tree.elements.length;
    const leaves = [randomLeaf(), randomLeaf()];
    tree.bulkInsert(leaves);

    const newSubtree = getLastSubtree(tree);
    const newRoot = BigInt(tree.root.toString());

    const inputs = {
      leaves,
      leafIndex,
      lastRoot,
      lastSubtree,
    };

    const witness = await insertLeavesPairCircuit.calculateWitness(inputs);

    expect(witness[1]).to.equal(newRoot);
    for (let i = 0; i < newSubtree.length; i++) {
      expect(witness[2 + i]).to.equal(newSubtree[i]);
    }
  });

  it('should correctly insert batch of leaves', async function () {
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
