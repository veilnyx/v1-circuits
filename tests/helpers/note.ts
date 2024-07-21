import { Point, poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { Hex } from 'viem';

export type NoteData = {
  owner: bigint;
  rootAddress: Hex;
  assetId: number;
  value: bigint;
  commitment: bigint;
  nullifier: bigint;
  blinding: bigint;
  leafIndex: number;
  revokerPublicKey: Point;
};

export const createNote = ({
  value,
  account,
  assetId,
  blinding,
  leafIndex,
  revokerPublicKey,
}: {
  account: any;
  value: bigint;
  assetId: number;
  blinding?: bigint;
  leafIndex: number;
  revokerPublicKey: Point;
}): NoteData => {
  const r = blinding || randomBigInt(31);
  const owner = BigInt(
    poseidonHash([account.rootAddress, revokerPublicKey.x, revokerPublicKey.y, r]),
  );
  const commitment = BigInt(poseidonHash([assetId, owner, value]));
  const nullifier = BigInt(
    poseidonHash([leafIndex, commitment, revokerPublicKey.mul(account.viewer.privateKey).x]),
  );

  return {
    rootAddress: account.rootAddress,
    owner,
    assetId,
    value,
    commitment,
    nullifier,
    blinding: r,
    leafIndex,
    revokerPublicKey,
  };
};
