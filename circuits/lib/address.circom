pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template RootAddress() {
    signal input signPublicKey[2];
    signal input viewPrivateKey;
    signal output out;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== signPublicKey[0];
    hasher.inputs[1] <== signPublicKey[1];
    hasher.inputs[2] <== viewPrivateKey;

    out <== hasher.out;
}

template BlindedAddress() {
    signal input rootAddress;
    signal input revokerPublicKey[2];
    signal input blinding;
    signal output out;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== rootAddress;
    hasher.inputs[1] <== revokerPublicKey[0];
    hasher.inputs[2] <== revokerPublicKey[1];
    hasher.inputs[3] <== blinding;

    out <== hasher.out;
}

template BlindedAddressCheck() {
    signal input rootAddress;
    signal input revokerPublicKey[2];
    signal input blinding;
    signal input blindedAddress;

    component xAddress = BlindedAddress();
    xAddress.rootAddress <== rootAddress;
    xAddress.revokerPublicKey <== revokerPublicKey;
    xAddress.blinding <== blinding;

    // ForceEqualIfEnabled
    (blindedAddress - xAddress.out) * blindedAddress === 0;
}