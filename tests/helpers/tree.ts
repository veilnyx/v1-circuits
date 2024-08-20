import { Fp, poseidonHash } from '@zkfi-tech/babyjubjub';
import { keccak256, stringToBytes } from 'viem';

export type MerkleTreeState = {
  depth: number;
  root: bigint;
  nextLeafIndex: number;
  subtrees: bigint[];
  zeros: bigint[];
};

export const zeroElement = Fp.from(BigInt(keccak256(stringToBytes('zero')))).val;

export const getInitialTreeState = (depth: number): MerkleTreeState => {
  let z = BigInt(zeroElement);
  const subtrees: bigint[] = [];
  const zeros: bigint[] = [];
  for (let i = 0; i < depth; i++) {
    zeros.push(z);
    subtrees.push(z);
    z = poseidonHash([z, z]);
  }
  const root = z;

  return { subtrees, zeros, root, nextLeafIndex: 0, depth };
};

export const insertLeaves = (tree: MerkleTreeState, leaves: bigint[]) => {
  let treeState = tree;
  for (let i = 0; i < leaves.length; i++) {
    treeState = insertLeaf(treeState, leaves[i]);
  }

  return treeState;
};

export const insertLeaf = (tree: MerkleTreeState, leaf: bigint): MerkleTreeState => {
  const depth = tree.depth;
  const newSubtrees = [...tree.subtrees];

  let currentLevelHash = leaf;
  let currentLevelIndex = tree.nextLeafIndex;

  let left: bigint;
  let right: bigint;

  for (let i = 0; i < depth; i++) {
    if (currentLevelIndex % 2 === 0) {
      left = currentLevelHash;
      right = tree.zeros[i];
      newSubtrees[i] = currentLevelHash;
    } else {
      left = newSubtrees[i];
      right = currentLevelHash;
    }

    currentLevelHash = poseidonHash([left, right]);
    currentLevelIndex = Math.floor(currentLevelIndex / 2);
  }

  return {
    depth,
    root: currentLevelHash,
    nextLeafIndex: tree.nextLeafIndex + 1,
    subtrees: newSubtrees,
    zeros: tree.zeros,
  };
};

// export const insertLeaves = (tree: MerkleTreeState, leaves: bigint[]) => {
//   if (leaves.length % 2 !== 0) {
//     throw new Error('Only even number of leaves are supported');
//   }

//   let treeState = tree;
//   for (let i = 0; i < leaves.length; i += 2) {
//     treeState = insertLeavesPair(treeState, [leaves[i], leaves[i + 1]]);
//   }

//   return treeState;
// };

// export const insertLeavesPair = (tree: MerkleTreeState, leaves: bigint[]) => {
//   if (leaves.length !== 2) {
//     throw new Error('Invalid number of leaves');
//   }

//   if (tree.nextLeafIndex % 2 !== 0) {
//     throw new Error('Invalid next leaf index');
//   }

//   const depth = tree.depth;
//   const nextIndex = tree.nextLeafIndex;

//   const newSubtree = [...tree.subtrees];

//   let currentLevelIndex = Math.floor(nextIndex / 2);
//   let currentLevelHash = poseidonHash([leaves[0], leaves[1]]);
//   let left: bigint;
//   let right: bigint;

//   for (let i = 1; i < depth; i++) {
//     if (currentLevelIndex % 2 === 0) {
//       left = currentLevelHash;
//       right = tree.zeros[i];
//       newSubtree[i] = currentLevelHash;
//     } else {
//       left = newSubtree[i];
//       right = currentLevelHash;
//     }

//     currentLevelHash = poseidonHash([left, right]);
//     currentLevelIndex = Math.floor(currentLevelIndex / 2);
//   }

//   const newTree: MerkleTreeState = {
//     depth,
//     root: currentLevelHash,
//     nextLeafIndex: nextIndex + 2,
//     subtrees: newSubtree,
//     zeros: tree.zeros,
//   };

//   return newTree;
// };
