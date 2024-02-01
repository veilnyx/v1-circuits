import { concatHex, padHex, size } from 'viem';
import { hexify } from '@zkfi-tech/utils';
import { BigIntLike, HexString } from '@zkfi-tech/shared-types';

export const encodeAsset = (assetId: BigIntLike, value: BigIntLike) => {
  const id = hexify(assetId);

  if (size(id) !== 3) {
    throw new Error('AssetId must be 3 bytes');
  }

  const val = hexify(value);
  if (size(val) > 28) {
    throw new Error('Value must be 28 bytes at most');
  }
  const encoded: HexString = concatHex([id, padHex(val, { size: 28 })]);
  return encoded;
};
