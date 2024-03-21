import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';

export type NoteData = {
  owner: bigint;
  assetId: number;
  value: bigint;
  commitment: bigint;
  nullifier: bigint;
  blinding: bigint;
  pubKey: bigint[];
  leafIndex: number;
};

export const createNote = ({
  value,
  pubKey,
  assetId,
  blinding,
  leafIndex,
}: {
  pubKey: bigint[];
  value: bigint;
  assetId: number;
  blinding?: bigint;
  leafIndex: number;
}): NoteData => {
  const r = blinding || randomBigInt(31);
  const owner = BigInt(poseidonHash([pubKey[0], pubKey[1], r]));
  const commitment = BigInt(poseidonHash([assetId, owner, value]));
  const nullifier = BigInt(poseidonHash([leafIndex, commitment, r]));

  return { owner, assetId, value, commitment, nullifier, blinding: r, pubKey, leafIndex };
};
