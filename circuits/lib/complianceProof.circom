pragma circom 2.1.5;

include "./encodeAsset.circom";
include "./elGamal.circom";

template ComplianceProof(n) {
    signal input ephKey;
    signal input ephPubKey[2];
    signal input encPubKey[2];

    signal input inPublicKeyX;
    signal input beneficiary;
    signal input beneficiaryBlinding;
    signal input outAssetIds[n];
    signal input outPublicKeyXs[n];
    signal input outValues[n];
    signal input outBlindings[n];

    signal input encInPublicKeyX;
    signal input encBeneficiaryBlinding;
    signal input encOutAssets[n];
    signal input encOutBlindings[n];
    signal input encOutPublicKeyXs[n];

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
        encVerifier.m[2*n+i] <== outPublicKeyXs[i];
        encVerifier.c[2*n+i] <== encOutPublicKeyXs[i];
    }

    encVerifier.enabled[3*n] <== 1;
    encVerifier.m[3*n] <== inPublicKeyX;
    encVerifier.c[3*n] <== encInPublicKeyX;

    encVerifier.enabled[3*n + 1] <== beneficiary;
    encVerifier.m[3*n + 1] <== beneficiaryBlinding;
    encVerifier.c[3*n + 1] <== encBeneficiaryBlinding;
}

// template ComplianceProof(n) {
//     signal input ephKey;
//     signal input ephPubKey[2];
//     signal input encPubKey[2];
//     signal input assetIds[n];
//     signal input publicKeyXs[n];
//     signal input values[n];
//     signal input blindings[n];
//     signal input beneficiaryBlinding;
//     signal input encAssets[n];
//     signal input encBlindings[n];
//     signal input encPublicKeyXs[n];
//     signal input encBeneficiaryBlinding;

//     signal ephKeyBits;

//     component checkEphKey = CheckEphemeralKey();
//     checkEphKey.ephKey <== ephKey;
//     checkEphKey.ephPubKey <== ephPubKey;
//     ephKeyBits <== checkEphKey.out;

//     component assetEncoder[n];
//     for (var i = 0; i < n; i++) {
//         assetEncoder[i] = EncodeAsset();
//         assetEncoder[i].assetId <== assetIds[i];
//         assetEncoder[i].value <== values[i];
//     }

//     component checkAssetEnc[n];
//     for (var i = 0; i < n; i++) { 
//         checkAssetEnc[i] = CheckEncryption();
//         check
//         checkAssetEnc[i].ephKeyBits <== ephKeyBits;
//         checkAssetEnc[i].encPubKey <== encPubKey;
//         checkAssetEnc.m[i] <== assetEncoder[i].out;
//         checkAssetEnc.c[i] <== encAssets[i];
//     }

//     component checkBlindingEnc[i];
//     for (var i = 0; i < n; i++) { 
//         checkBlindingEnc[i] = CheckEncryption();
//         checkAssetEnc[i].ephKeyBits <== ephKeyBits;
//         checkAssetEnc[i].encPubKey <== encPubKey;
//         checkBlindingEnc.m[i] <== blindings[i];
//         checkBlindingEnc.c[i] <== encBlindings[i];
//     }

//     component checkPublicKeyXEnc = CheckEncryption(n);
//     for (var i = 0; i < n; i++) { 
//         checkPublicKeyXEnc[i] <== CheckEncryption();
//         checkAssetEnc[i].ephKeyBits <== ephKeyBits;
//         checkAssetEnc[i].encPubKey <== encPubKey;
//         checkPublicKeyXEnc.m[i] <== publicKeyXs[i];
//         checkPublicKeyXEnc.c[i] <== encPublicKeyXs[i];
//     }

//     component checkBeneficiaryBlindingEnc = CheckEncryption();
//     checkBeneficiaryBlindingEnc.m <== beneficiaryBlinding;
//     checkBeneficiaryBlindingEnc.c <== encBeneficiaryBlinding;
// }

// template ComplianceProof(n) {
//     signal input ephKey;
//     signal input ephPubKey[2];
//     signal input encPubKey[2];
//     signal input assetIds[n];
//     signal input publicKeyXs[n];
//     signal input values[n];
//     signal input blindings[n];
//     signal input encAssets[n];
//     signal input encBlindings[n];
//     signal input encPublicKeyXs[n];

//     component assetEncoder[n];
//     for (var i = 0; i < n; i++) {
//         assetEncoder[i] = EncodeAsset();
//         assetEncoder[i].assetId <== assetIds[i];
//         assetEncoder[i].value <== values[i];
//     }

//     component encVerifier = ElGamalEncryptMulti(3*n);
//     encVerifier.ephKey <== ephKey;
//     encVerifier.ephPubKey <== ephPubKey;
//     encVerifier.encPubKey <== encPubKey;

//     for (var i = 0; i < n; i++) {
//         encVerifier.m[i] <== assetEncoder[i].out;
//         encVerifier.c[i] <== encAssets[i];
//     }

//     for (var i = 0; i < n; i++) {
//         encVerifier.m[n+i] <== blindings[i];
//         encVerifier.c[n+i] <== encBlindings[i];
//     }

//     for (var i = 0; i < n; i++) {
//         encVerifier.m[2*n+i] <== publicKeyXs[i];
//         encVerifier.c[2*n+i] <== encPublicKeyXs[i];
//     }
// }