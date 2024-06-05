import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { expectEqFe, expectNeqFe, getCircuit, randomHex } from './helpers';

describe('stealthAddress', function () {
  it('correctly calculate stealth address', async function () {
    const circuit = await getCircuit('stealthAddress');
    const address = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const stealthAddress = poseidonHash([
      address,
      revokerPublicKey[0],
      revokerPublicKey[1],
      blinding,
    ]);
    const inputs = { address, revokerPublicKey, blinding };
    const witness = await circuit.calculateWitness(inputs, true);
    expectEqFe(witness[1], stealthAddress);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of stealth address', async function () {
    const circuit = await getCircuit('stealthAddress');
    const address = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const stealthAddress = poseidonHash([revokerPublicKey[0], revokerPublicKey[1], blinding]);
    const inputs = { address, revokerPublicKey, blinding: randomHex(31) };
    const witness = await circuit.calculateWitness(inputs, true);
    expectNeqFe(witness[1], stealthAddress);
  });
});
