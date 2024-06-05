import { assert } from 'chai';
import { randomHex } from '@zkfi-tech/utils';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { getCircuit, randomAccount } from './helpers';

describe('schnorr', function () {
  this.timeout(8000);
  let circuit;

  before(async function () {
    circuit = await getCircuit('schnorr');
  });

  it('should verify successfully for correct signature', async function () {
    const message = poseidonHash(randomHex(32));
    const account = randomAccount();
    const sign = account.sign(message);

    const inputs = {
      enabled: 1,
      m: message,
      publicKey: [account.signer.publicKey.x, account.signer.publicKey.y],
      e: sign.e,
      s: sign.s,
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });

  it('should fail verification for bad signatures', async function () {
    const message = poseidonHash(randomHex(32));
    const account = randomAccount();

    const badAccount = randomAccount();
    const badSign = badAccount.sign(message);
    const badInputs = {
      enabled: 1,
      m: message,
      publicKey: [account.signer.publicKey.x, account.signer.publicKey.y],
      e: badSign.e,
      s: badSign.s,
    };

    await assert.isRejected(circuit.calculateWitness(badInputs, true));
  });
});
