pragma circom 2.1.5;

include "./schnorr.circom";

template OwnershipProof() {
    signal input hash;
    signal input publicKey[2];
    signal input signature[2];

    component schnorr = SchnorrVerify();
    schnorr.enabled <== 1;
    schnorr.m <== hash;
    schnorr.publicKey <== publicKey;
    schnorr.s <== signature[0];
    schnorr.e <== signature[1];
}
