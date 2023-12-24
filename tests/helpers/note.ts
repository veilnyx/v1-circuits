import { BigNumber, BigNumberish } from 'ethers';
import { poseidonHash } from '@zkfi-tech/babyjubjub';

export const createNote = ({
  value,
  owner,
  assetId = 1,
}: {
  value: BigNumberish;
  owner: string;
  assetId?: BigNumberish;
}) => {
  assetId = BigNumber.from(assetId).toHexString();
  value = BigNumber.from(value).toHexString();
  const commitment = poseidonHash([assetId, owner, value]);

  return { owner, assetId, value, commitment };
};
