import { assert } from 'chai';
import { Account, Fp, Note } from '@zkfi-tech/v1-sdk/src';
import { getCircuit, poseidonHash, randomAccount, randomHex, signPoseidon } from './helpers';

describe('ownershipProof', function () {
  this.timeout(8000);
  let circuit;

  before(async function () {
    circuit = await getCircuit('ownershipProof');
  });

  it('should verify successfully for correct signature', async function () {
    const account = Account.random();
    const note = Note.fromAccount({
      assetId: Fp.random(20).toHexString(),
      account,
      value: Fp.random(20),
    });
    const xSigner = account.deriveStealthSigner(note.xData as any);
    const sign = signPoseidon(note.commitment, xSigner.privateKey);

    const inputs = {
      commitment: note.commitment,
      publicKey: xSigner.publicKey.toArray(),
      signature: [sign.s, sign.e],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });

  it('should verify successfully for correct signature', async function () {
    const commitment = poseidonHash(randomHex(32));
    const account = randomAccount();
    const sign = signPoseidon(commitment, account.privateKey);

    const inputs = {
      commitment,
      publicKey: account.publicKey,
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
    const badSign = signPoseidon(commitment, badAccount.privateKey);

    const inputs = {
      commitment,
      publicKey: account.publicKey,
      signature: [badSign.s, badSign.e],
    };

    await assert.isRejected(circuit.calculateWitness(inputs, true), Error);
  });

  it('should fail verification for incorrect message or public key', async function () {
    const commitment = poseidonHash(randomHex(32));
    const badCommitment = poseidonHash(randomHex(32));
    const account = randomAccount();
    const badAccount = randomAccount();
    const badSign = signPoseidon(commitment, account.privateKey);

    const badCommitmentInputs = {
      commitment: badCommitment,
      publicKey: account.publicKey,
      signature: [badSign.s, badSign.e],
    };

    const badPublicKeyInputs = {
      commitment,
      publicKey: badAccount.publicKey,
      signature: [badSign.s, badSign.e],
    };

    await assert.isRejected(circuit.calculateWitness(badCommitmentInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badPublicKeyInputs, true), Error);
  });
});
