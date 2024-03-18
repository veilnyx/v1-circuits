import { poseidonHash } from '@zkfi-tech/babyjubjub';

export const createNote = ({
  value,
  owner,
  assetId,
}: {
  value: bigint | string | number;
  owner: string;
  assetId: bigint | string | number;
}) => {
  const commitment = poseidonHash([assetId, owner, value]);

  return { owner, assetId, value, commitment };
};
