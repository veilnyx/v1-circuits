import { expect } from 'chai';
import { parseEther } from 'viem';
import { getCircuit } from './helpers';

const eth = (n: number) => parseEther(`${n}`);

describe('countAssets', function () {
  let circuit;

  before(async function () {
    circuit = await getCircuit('countAssets');
  });

  it('should count assets correctly', async function () {
    const selectedAssetId = 0x020008;
    const selectedAssetValue = 123; // nft id
    const assetIds = [0x010001, selectedAssetId, 0x010002, selectedAssetId, selectedAssetId];
    const values = [eth(4), selectedAssetValue, selectedAssetValue, 234, selectedAssetValue];
    const actualCount = values.filter(
      (v, i) => selectedAssetId === assetIds[i] && v === selectedAssetValue,
    ).length;

    const inputs = { selectedAssetId, selectedAssetValue, assetIds, values };
    const witness = await circuit.calculateWitness(inputs, true);
    expect(witness[1]).to.equal(BigInt(actualCount));
  });
});
