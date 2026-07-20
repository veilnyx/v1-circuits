import { PointType, poseidonHash } from '@veilnyx-sdk/babyjubjub';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { Hex } from 'viem';

export type NoteData = {
  owner: bigint;
  rootAddress: bigint;
  assetId: number;
  value: bigint;
  commitment: bigint;
  nullifier: bigint;
  blinding: bigint;
  leafIndex: number;
  revokerPublicKey: PointType;
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
  revokerPublicKey: PointType;
}): NoteData => {
  const r = blinding || randomBigInt(31);
  const owner = BigInt(
    poseidonHash([account.rootAddress, revokerPublicKey.x, revokerPublicKey.y, r]),
  );
  const commitment = BigInt(poseidonHash([BigInt(assetId), owner, value]));
  const nullifier = BigInt(
    poseidonHash([
      BigInt(leafIndex),
      commitment,
      revokerPublicKey.multiply(account.viewer.privateKey).x,
    ]),
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
