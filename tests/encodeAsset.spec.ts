import { expect } from 'chai';
import { concatHex, padHex, size } from 'viem';
import { randomHex, toBigInt } from '@zkfi-tech/utils';
import { getCircuit } from './helpers';

describe('encodeAsset', () => {
  let circuit;

  before(async function () {
    circuit = await getCircuit('encodeAsset');
  });

  it('should correctly encode asset', async () => {
    const assetId = '0x010001'; // 3 bytes
    const value = randomHex(16); // 28 bytes

    // 31 bytes
    const encoded = concatHex([assetId, padHex(value, { size: 28 })]);
    expect(size(encoded)).to.equal(31);

    const inputs = {
      assetId,
      value,
    };

    const witness = await circuit.calculateWitness(inputs, true);
    const output = witness[1];
    expect(output).to.equal(toBigInt(encoded));
  });
});
