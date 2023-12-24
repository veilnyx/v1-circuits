import { assert } from 'chai';
import { randomHex } from '@zkfi-tech/utils';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { getCircuit, randomAccount } from './helpers';

describe('ownershipProof', function () {
  this.timeout(8000);
  let circuit;

  before(async function () {
    circuit = await getCircuit('ownershipProof');
  });

  it('should verify successfully for correct signature', async function () {
    const commitment = poseidonHash(randomHex(32));
    const account = randomAccount();
    const sign = account.sign(commitment);

    const inputs = {
      commitment,
      publicKey: account.signer.publicKey.toArray(),
      signature: [sign.s, sign.e],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });

  it('should fail verification for incorrect signatures', async function () {
    const commitment = poseidonHash(randomHex(32));
    const account = randomAccount();
    const badAccount = randomAccount();
    const badSign = badAccount.sign(commitment);

    const inputs = {
      commitment,
      publicKey: account.signer.publicKey.toArray(),
      signature: [badSign.s, badSign.e],
    };

    await assert.isRejected(circuit.calculateWitness(inputs, true), Error);
  });

  it('should fail verification for incorrect message or public key', async function () {
    const commitment = poseidonHash(randomHex(32));
    const badCommitment = poseidonHash(randomHex(32));
    const account = randomAccount();
    const badAccount = randomAccount();
    const badSign = badAccount.sign(commitment);

    const badCommitmentInputs = {
      commitment: badCommitment,
      publicKey: account.signer.publicKey,
      signature: [badSign.s, badSign.e],
    };

    const badPublicKeyInputs = {
      commitment,
      publicKey: badAccount.signer.publicKey,
      signature: [badSign.s, badSign.e],
    };

    await assert.isRejected(circuit.calculateWitness(badCommitmentInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badPublicKeyInputs, true), Error);
  });
});
