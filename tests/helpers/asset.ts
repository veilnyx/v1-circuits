import { concatHex, Hex, padHex, size, toHex } from 'viem';

export const encodeAsset = (assetId: number, value: bigint) => {
  const id = toHex(assetId);

  if (size(id) !== 3) {
    throw new Error('AssetId must be 3 bytes');
  }

  const val = toHex(value);
  if (size(val) > 28) {
    throw new Error('Value must be 28 bytes at most');
  }
  const encoded: Hex = concatHex([id, padHex(val, { size: 28 })]);
  return BigInt(encoded);
};
