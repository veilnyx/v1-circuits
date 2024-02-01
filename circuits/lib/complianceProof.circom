pragma circom 2.1.5;

include "./encodeAsset.circom";
include "./elGamal.circom";

template ComplianceProof(n) {
    signal input publicKey[2];
    signal input ephKey;
    signal input c1Packed;
    signal input assetIds[n];
    signal input values[n];
    signal input encAssets[n];

    component assetEncoder[n];
    for (var i = 0; i < n; i++) {
        assetEncoder[i] = EncodeAsset();
        assetEncoder[i].assetId <== assetIds[i];
        assetEncoder[i].value <== values[i];
    }

    component encVerifier = ElGamalEncryptMulti(n);
    encVerifier.r <== ephKey;
    encVerifier.publicKey <== publicKey;
    encVerifier.c1Packed <== c1Packed;

    for (var i = 0; i < n; i++) {
        encVerifier.m[i] <== assetEncoder[i].out;
        encVerifier.c2[i] <== encAssets[i];
    }
}