import { BigNumber, BigNumberish } from 'ethers';
import { poseidonHash, randomHex } from '.';

export const createNote = ({
  value,
  address,
  assetId = 1,
}: {
  value: BigNumberish;
  address: string;
  assetId?: BigNumberish;
}) => {
  assetId = BigNumber.from(assetId).toHexString();
  value = BigNumber.from(value).toHexString();
  const salt = randomHex(31);
  const commitment = poseidonHash(assetId, address, value, salt);

  return { address, assetId, value, salt, commitment };
};
