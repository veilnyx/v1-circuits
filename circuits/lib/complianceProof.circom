pragma circom 2.1.5;

include "./encodeAsset.circom";
include "./elGamal.circom";

template ComplianceProof(n) {
    signal input ephemeralKey;
    signal input ephemeralPublicKey[2];
    signal input encryptionPublicKey[2];

    signal input inRootAddress;
    signal input refundAddress;
    signal input refundAddressBlinding;
    signal input outAssetIds[n];
    signal input outRootAddresses[n];
    signal input outValues[n];
    signal input outBlindings[n];

    signal input encryptedInRootAddress;
    signal input encryptedRefundAddressBlinding;
    signal input encryptedOutAssets[n];
    signal input encryptedOutBlindings[n];
    signal input encryptedOutRootAddresses[n];

    component assetEncoder[n];
    for (var i = 0; i < n; i++) {
        assetEncoder[i] = EncodeAsset();
        assetEncoder[i].assetId <== outAssetIds[i];
        assetEncoder[i].value <== outValues[i];
    }

    component encVerifier = ElGamalEncryptMulti(3*n + 2);
    encVerifier.ephemeralKey <== ephemeralKey;
    encVerifier.ephemeralPublicKey <== ephemeralPublicKey;
    encVerifier.encryptionPublicKey <== encryptionPublicKey;

    for (var i = 0; i < n; i++) {
        encVerifier.enabled[i] <== 1;
        encVerifier.m[i] <== assetEncoder[i].out;
        encVerifier.c[i] <== encryptedOutAssets[i];
    }

    for (var i = 0; i < n; i++) {
        encVerifier.enabled[n+i] <== 1;
        encVerifier.m[n+i] <== outBlindings[i];
        encVerifier.c[n+i] <== encryptedOutBlindings[i];
    }

    for (var i = 0; i < n; i++) {
        encVerifier.enabled[2*n+i] <== 1;
        encVerifier.m[2*n+i] <== outRootAddresses[i];
        encVerifier.c[2*n+i] <== encryptedOutRootAddresses[i];
    }

    encVerifier.enabled[3*n] <== 1;
    encVerifier.m[3*n] <== inRootAddress;
    encVerifier.c[3*n] <== encryptedInRootAddress;

    encVerifier.enabled[3*n + 1] <== refundAddress;
    encVerifier.m[3*n + 1] <== refundAddressBlinding;
    encVerifier.c[3*n + 1] <== encryptedRefundAddressBlinding;
}
