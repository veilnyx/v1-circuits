pragma circom 2.1.5;

include "./encodeAsset.circom";
include "./elGamal.circom";

template ComplianceProof(n) {
    signal input ephKey;
    signal input ephPubKey[2];
    signal input encPubKey[2];

    signal input inAddress;
    signal input beneficiary;
    signal input beneficiaryBlinding;
    signal input outAssetIds[n];
    signal input outAddresses[n];
    signal input outValues[n];
    signal input outBlindings[n];

    signal input encInAddress;
    signal input encBeneficiaryBlinding;
    signal input encOutAssets[n];
    signal input encOutBlindings[n];
    signal input encOutAddresses[n];

    component assetEncoder[n];
    for (var i = 0; i < n; i++) {
        assetEncoder[i] = EncodeAsset();
        assetEncoder[i].assetId <== outAssetIds[i];
        assetEncoder[i].value <== outValues[i];
    }

    component encVerifier = ElGamalEncryptMulti(3*n + 2);
    encVerifier.ephKey <== ephKey;
    encVerifier.ephPubKey <== ephPubKey;
    encVerifier.encPubKey <== encPubKey;

    for (var i = 0; i < n; i++) {
        encVerifier.enabled[i] <== 1;
        encVerifier.m[i] <== assetEncoder[i].out;
        encVerifier.c[i] <== encOutAssets[i];
    }

    for (var i = 0; i < n; i++) {
        encVerifier.enabled[n+i] <== 1;
        encVerifier.m[n+i] <== outBlindings[i];
        encVerifier.c[n+i] <== encOutBlindings[i];
    }

    for (var i = 0; i < n; i++) {
        encVerifier.enabled[2*n+i] <== 1;
        encVerifier.m[2*n+i] <== outAddresses[i];
        encVerifier.c[2*n+i] <== encOutAddresses[i];
    }

    encVerifier.enabled[3*n] <== 1;
    encVerifier.m[3*n] <== inAddress;
    encVerifier.c[3*n] <== encInAddress;

    encVerifier.enabled[3*n + 1] <== beneficiary;
    encVerifier.m[3*n + 1] <== beneficiaryBlinding;
    encVerifier.c[3*n + 1] <== encBeneficiaryBlinding;
}
