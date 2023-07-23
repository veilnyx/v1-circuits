import { Account } from '@zkfi-tech/v1-sdk/src';
import { expectEqFe, getCircuit, poseidonHash, randomHex } from './helpers';

describe('nullifier', function () {
  this.timeout(8000);

  it('correctly calculates nullifier', async function () {
    const circuit = await getCircuit('nullifier');

    const account = Account.random();
    const commitment = poseidonHash(randomHex(32));
    const viewKey = account.viewer.privateKey;
    const pathIndices = 5;

    const inputs = {
      pathIndices: pathIndices,
      commitment,
      viewKey,
    };

    const nullifier = poseidonHash(pathIndices, commitment, viewKey);

    const witness = await circuit.calculateWitness(inputs);

    expectEqFe(witness[1], nullifier);

    await circuit.checkConstraints(witness);
  });
});
