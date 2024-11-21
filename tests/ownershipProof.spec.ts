import { assert } from 'chai';
import { randomBigInt } from '@zkfi-tech/utils';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { MSG_ASSERT_FAILED, getCircuit, randomAccount } from './helpers';

describe('ownershipProof', function () {
  this.timeout(8000);
  let circuit;

  before(async function () {
    circuit = await getCircuit('ownershipProof');
  });

  it('should verify successfully for correct signature', async function () {
    const hash = poseidonHash([randomBigInt(31)]);
    const account = randomAccount();
    const sign = account.sign(hash);

    const inputs = {
      hash,
      publicKey: account.signer.publicKey.toArray(),
      signature: [sign.s, sign.e],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });

  it('should fail verification for incorrect signatures', async function () {
    const hash = poseidonHash([randomBigInt(31)]);
    const account = randomAccount();
    const badAccount = randomAccount();
    const badSign = badAccount.sign(hash);

    const inputs = {
      hash,
      publicKey: account.signer.publicKey.toArray(),
      signature: [badSign.s, badSign.e],
    };

    await assert.isRejected(circuit.calculateWitness(inputs, true), MSG_ASSERT_FAILED);
  });

  it('should fail verification for incorrect message or public key', async function () {
    const hash = poseidonHash([randomBigInt(31)]);
    const badHash = poseidonHash([randomBigInt(31)]);
    const account = randomAccount();
    const sign = account.sign(hash);
    const badAccount = randomAccount();
    const badSign = badAccount.sign(hash);

    const badCommitmentInputs = {
      hash: badHash,
      publicKey: account.signer.publicKey.toArray(),
      signature: [badSign.s, badSign.e],
    };

    const badPublicKeyInputs = {
      hash,
      publicKey: badAccount.signer.publicKey.toArray(),
      signature: [sign.s, sign.e],
    };

    await assert.isRejected(circuit.calculateWitness(badCommitmentInputs, true), MSG_ASSERT_FAILED);
    await assert.isRejected(circuit.calculateWitness(badPublicKeyInputs, true), MSG_ASSERT_FAILED);
  });
});
