import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { Hex } from 'viem';

export type NoteData = {
  owner: bigint;
  address: Hex;
  assetId: number;
  value: bigint;
  commitment: bigint;
  nullifier: bigint;
  blinding: bigint;
  leafIndex: number;
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
  revokerPublicKey;
}): NoteData => {
  const r = blinding || randomBigInt(31);
  const owner = BigInt(poseidonHash([account.address, revokerPublicKey.x, revokerPublicKey.y, r]));
  const commitment = BigInt(poseidonHash([assetId, owner, value]));
  const nullifier = BigInt(
    poseidonHash([leafIndex, revokerPublicKey.mul(account.viewer.privateKey).x]),
  );

  return {
    address: account.address,
    owner,
    assetId,
    value,
    commitment,
    nullifier,
    blinding: r,
    leafIndex,
  };
};
