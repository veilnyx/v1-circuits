import { assert, expect } from 'chai';
import { randomBN } from './helpers';
import { schnorr } from './helpers/schnorr';

describe('schnorr', function () {
  it('should sign/verify correctly', async function () {
    const privateKey = randomBN(31).toBigInt();
    const msg = randomBN(32).toBigInt();
    const k = randomBN(31).toBigInt();
    const pubKey = schnorr.prv2pub(privateKey);
    const sig = schnorr.signPoseidon(privateKey, msg, k);
    const verified = schnorr.verifyPoseidon(sig, pubKey, msg);
    expect(verified).to.be.true;

    const badPrivateKey = randomBN(31).toBigInt();
    const badPubKey = schnorr.prv2pub(badPrivateKey);
    const badSig = schnorr.signPoseidon(badPrivateKey, msg, k);
    const badVerified = schnorr.verifyPoseidon(badSig, pubKey, msg);
    expect(badVerified).to.be.false;
  });
});
