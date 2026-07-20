import { assert } from 'chai';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { poseidonHash } from '@veilnyx-sdk/babyjubjub';
import { MSG_ASSERT_FAILED, getCircuit, randomAccount } from './helpers';

describe('schnorr', function () {
  this.timeout(8000);
  let circuit;

  before(async function () {
    circuit = await getCircuit('schnorr');
  });

  it('should verify successfully for correct signature', async function () {
    const message = poseidonHash([randomBigInt(31)]);
    const account = randomAccount();
    const sign = account.sign(message);

    const inputs = {
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
    const message = poseidonHash([randomBigInt(31)]);
    const account = randomAccount();

    const badAccount = randomAccount();
    const badSign = badAccount.sign(message);
    const badInputs = {
      m: message,
      publicKey: [account.signer.publicKey.x, account.signer.publicKey.y],
      e: badSign.e,
      s: badSign.s,
    };

    await assert.isRejected(circuit.calculateWitness(badInputs, true), MSG_ASSERT_FAILED);
  });
});
