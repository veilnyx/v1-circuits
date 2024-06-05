pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Address() {
    signal input signPublicKey[2];
    signal input viewPrivateKey;
    signal output out;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== signPublicKey[0];
    hasher.inputs[1] <== signPublicKey[1];
    hasher.inputs[2] <== viewPrivateKey;

    out <== hasher.out;
}

template StealthAddress() {
    signal input address;
    signal input revokerPublicKey[2];
    signal input blinding;
    signal output out;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== address;
    hasher.inputs[1] <== revokerPublicKey[0];
    hasher.inputs[2] <== revokerPublicKey[1];
    hasher.inputs[3] <== blinding;

    out <== hasher.out;
}