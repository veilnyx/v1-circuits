import { expect } from 'chai';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { poseidonHash } from '@veilnyx-sdk/babyjubjub';
import { getCircuit } from './helpers';

describe('commitment', function () {
  it('correctly calculates note commitment', async function () {
    const circuit = await getCircuit('commitment');
    const inputs = {
      assetId: Number(0x010001),
      owner: randomBigInt(31),
      value: randomBigInt(16),
    };

    const commitment = poseidonHash([BigInt(inputs.assetId), inputs.owner, inputs.value]);
    const witness = await circuit.calculateWitness(inputs);

    expect(witness[1]).to.equal(commitment);

    await circuit.checkConstraints(witness);
  });
});
