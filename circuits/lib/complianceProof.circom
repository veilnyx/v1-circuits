pragma circom 2.1.5;

include "./encodeAsset.circom";
include "./elGamal.circom";

template ComplianceProof(n) {
    signal input ephKey;
    signal input ephPubKey[2];
    signal input encPubKey[2];
    signal input assetIds[n];
    signal input publicKeyXs[n];
    signal input values[n];
    signal input blindings[n];
    signal input encAssets[n];
    signal input encBlindings[n];
    signal input encPublicKeyXs[n];

    component assetEncoder[n];
    for (var i = 0; i < n; i++) {
        assetEncoder[i] = EncodeAsset();
        assetEncoder[i].assetId <== assetIds[i];
        assetEncoder[i].value <== values[i];
    }

    component encVerifier = ElGamalEncryptMulti(3*n);
    encVerifier.ephKey <== ephKey;
    encVerifier.ephPubKey <== ephPubKey;
    encVerifier.encPubKey <== encPubKey;

    for (var i = 0; i < n; i++) {
        encVerifier.m[i] <== assetEncoder[i].out;
        encVerifier.c[i] <== encAssets[i];
    }

    for (var i = 0; i < n; i++) {
        encVerifier.m[n+i] <== blindings[i];
        encVerifier.c[n+i] <== encBlindings[i];
    }

    for (var i = 0; i < n; i++) {
        encVerifier.m[2*n+i] <== publicKeyXs[i];
        encVerifier.c[2*n+i] <== encPublicKeyXs[i];
    }
}