import { expect } from 'chai';
import { randomBigInt, toBigInt } from '@zkfi-tech/utils';
import { getCircuit } from './helpers';
import { encodeAsset } from './helpers/asset';

describe('encodeAsset', () => {
  let circuit;

  before(async function () {
    circuit = await getCircuit('encodeAsset');
  });

  it('should correctly encode asset', async () => {
    const assetId = 0x010001; // 3 bytes
    const value = randomBigInt(16); // 28 bytes

    // 31 bytes
    const encoded = encodeAsset(assetId, value);

    const inputs = {
      assetId,
      value,
    };

    const witness = await circuit.calculateWitness(inputs, true);
    const output = witness[1];
    expect(output).to.equal(toBigInt(encoded));
  });
});
