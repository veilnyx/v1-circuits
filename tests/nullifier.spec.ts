import {
  expectEqFe,
  getCircuit,
  poseidonHash,
  randomAccount,
  randomHex,
  signPoseidon,
} from './helpers';

describe('nullifier', function () {
  this.timeout(8000);

  it('correctly calculates nullifier', async function () {
    const circuit = await getCircuit('nullifier');

    const account = randomAccount();
    const commitment = poseidonHash(randomHex(32));
    const sign = signPoseidon(commitment, account.privateKey);
    const pathIndices = 5;

    const inputs = {
      pathIndices: pathIndices,
      signature: [sign.R8[0], sign.R8[1], sign.S],
    };

    const nullifier = poseidonHash(pathIndices, sign.R8[0], sign.R8[1], sign.S);

    const witness = await circuit.calculateWitness(inputs);

    expectEqFe(witness[1], nullifier);

    await circuit.checkConstraints(witness);
  });
});
