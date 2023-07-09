import { expectEqFe, getCircuit, poseidonHash, randomHex } from './helpers';

describe('commitment', function () {
  it('correctly calculates note commitment', async function () {
    const circuit = await getCircuit('commitment');
    const inputs = {
      assetId: randomHex(20),
      owner: randomHex(31),
      value: randomHex(8),
      salt: randomHex(31),
    };

    const commitment = poseidonHash(inputs.assetId, inputs.owner, inputs.value, inputs.salt);
    const witness = await circuit.calculateWitness(inputs);

    expectEqFe(witness[1], commitment);

    await circuit.checkConstraints(witness);
  });
});
