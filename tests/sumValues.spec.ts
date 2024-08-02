import { expect } from 'chai';
import { parseEther } from 'viem';
import { getCircuit } from './helpers';

const eth = (n: number) => parseEther(`${n}`);

describe('sumValues', function () {
  let circuit;

  before(async function () {
    circuit = await getCircuit('sumValues');
  });

  it('should sum values correctly', async function () {
    const selectedAssetId = 0x010001;
    const assetIds = [selectedAssetId, 0x010002, 0x020003, selectedAssetId, selectedAssetId];
    const values = [eth(4), eth(1), eth(3), eth(2), eth(4)];
    const actualSum = values.reduce((sum, v, i) => {
      if (assetIds[i] === selectedAssetId) {
        return sum + v;
      }
      return sum;
    }, eth(0));

    const inputs = { selectedAssetId, assetIds, values };
    const witness = await circuit.calculateWitness(inputs, true);
    expect(witness[1]).to.equal(actualSum);
  });
});
