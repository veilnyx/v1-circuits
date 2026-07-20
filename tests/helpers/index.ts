import { Point, PointType, schnorr, fr, poseidonHash } from '@veilnyx-sdk/babyjubjub';
import { bytesToBigInt, Hex, isHex, padBytes, padHex, sliceBytes, toBytes, toHex } from 'viem';
import MerkleTree, { Element } from 'fixed-merkle-tree';
import { toBigInt } from '@veilnyx-sdk/utils';

export * from './binding';
export * from './circuit';
export * from './note';
export * from './tree';

export const MSG_ASSERT_FAILED = 'Assert Failed';

/**
 * Circuits take a curve point as a two-signal array. `@veilnyx-sdk/babyjubjub` exposes the raw
 * noble-curves point, which has `x`/`y` getters but no array form of its own.
 */
export const pointToArray = (p: { x: bigint; y: bigint }): [bigint, bigint] => [p.x, p.y];

export const toPaddedHex = (n: bigint | string | number) => {
  let x: Hex;
  if (isHex(n)) {
    x = n;
  } else if (typeof n === 'bigint' || typeof n === 'number') {
    x = toHex(n);
  } else {
    throw new Error('Invalid input');
  }

  return padHex(x, { size: 32 });
};

export const deriveKeys = (seed: bigint, n: number) => {
  const hashes: bigint[] = [];
  for (let i = 0; i < n; i++) {
    const s = i === 0 ? seed : hashes[i - 1];
    const hash = padBytes(toBytes(poseidonHash([BigInt(i), s])), { size: 32 });
    hashes.push(bytesToBigInt(hash));
  }

  const keys = hashes.map((h) => bytesToBigInt(sliceBytes(toBytes(h), 1)));
  return keys;
};

export const getMerkleTree = (depth: number, leaves: bigint[] = [], zeroLeaf?: bigint) => {
  const hashFunction = (a: Element, b: Element) => {
    const hash = poseidonHash([toBigInt(a), toBigInt(b)]);
    return toPaddedHex(hash);
  };

  const elements = leaves.map((l) => toPaddedHex(l));
  const zeroElement = zeroLeaf ? toPaddedHex(zeroLeaf) : undefined;
  return new MerkleTree(depth, elements, { hashFunction, zeroElement });
};

export const randomKeyPair = () => {
  const privateKey = fr.random();
  const publicKey = Point.generate(privateKey);

  return {
    privateKey,
    publicKey,
  };
};

export const randomAccount = () => {
  const signer = randomKeyPair();
  const viewer = randomKeyPair();
  const rootAddress = BigInt(
    poseidonHash([signer.publicKey.x, signer.publicKey.y, viewer.privateKey]),
  );

  return {
    signer,
    viewer,
    rootAddress,
    sign(message: bigint) {
      return schnorr.sign(message, signer.privateKey);
    },
    getBlindedAddress(revokerPublicKey: PointType, blinding: bigint | string) {
      return BigInt(
        poseidonHash([this.rootAddress, revokerPublicKey.x, revokerPublicKey.y, toBigInt(blinding)]),
      );
    },
  };
};
