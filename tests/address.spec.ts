import { expectEqFe, getCircuit, poseidonHash, randomHex } from './helpers';

describe('address', function () {
  it('correctly calculate address', async function () {
    const circuit = await getCircuit('address');
    const publicKey = [randomHex(31), randomHex(31)];
    const address = poseidonHash(publicKey[0], publicKey[1]);
    const inputs = { publicKey };
    const witness = await circuit.calculateWitness(inputs, true);
    expectEqFe(witness[1], address);
    await circuit.checkConstraints(witness);
  });
});
