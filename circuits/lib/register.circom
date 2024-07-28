pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "./address.circom";
include "./ecc.circom";

template Register() {
    signal input rootAddress;
    signal input viewPrivateKey;
    signal input viewPublicKey[2];
    signal input signPublicKey[2];

    // Caclulate viewPublicKey and constrain it
    component vkMulG = PrivateKeyToPublicKey();
    vkMulG.privateKey <== viewPrivateKey;
    vkMulG.out === viewPublicKey;

    component rootAddr = RootAddress();
    rootAddr.signPublicKey <== signPublicKey;
    rootAddr.viewPrivateKey <== viewPrivateKey;
    rootAddr.out === rootAddress;
}