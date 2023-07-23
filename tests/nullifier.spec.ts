import { Account } from '@zkfi-tech/v1-sdk/src';
import { expectEqFe, getCircuit, poseidonHash, randomAccount } from './helpers';

describe('nullifier', function () {
  this.timeout(8000);

  it('correctly calculates nullifier', async function () {
    const circuit = await getCircuit('nullifier');

    const account = Account.random();
    const viewKey = account.viewer.privateKey;
    const pathIndices = 5;

    const inputs = {
      pathIndices: pathIndices,
      viewKey,
    };

    const nullifier = poseidonHash(pathIndices, viewKey);

    const witness = await circuit.calculateWitness(inputs);

    expectEqFe(witness[1], nullifier);

    await circuit.checkConstraints(witness);
  });
});
