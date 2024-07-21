import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { expectEqFe, expectNeqFe, getCircuit, randomHex } from './helpers';

describe('blindedAddress', function () {
  it('correctly calculate blinded address', async function () {
    const circuit = await getCircuit('blindedAddress');
    const rootAddress = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const blindedAddress = poseidonHash([
      rootAddress,
      revokerPublicKey[0],
      revokerPublicKey[1],
      blinding,
    ]);
    const inputs = { rootAddress, revokerPublicKey, blinding };
    const witness = await circuit.calculateWitness(inputs, true);
    expectEqFe(witness[1], blindedAddress);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of blinded address', async function () {
    const circuit = await getCircuit('blindedAddress');
    const rootAddress = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const blindedAddress = poseidonHash([revokerPublicKey[0], revokerPublicKey[1], blinding]);
    const inputs = { rootAddress, revokerPublicKey, blinding: randomHex(31) };
    const witness = await circuit.calculateWitness(inputs, true);
    expectNeqFe(witness[1], blindedAddress);
  });
});
