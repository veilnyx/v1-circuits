pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

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

template StealthAddressCheck() {
    signal input address;
    signal input revokerPublicKey[2];
    signal input blinding;
    signal input stealthAddress;

    component xAddress = StealthAddress();
    xAddress.address <== address;
    xAddress.revokerPublicKey <== revokerPublicKey;
    xAddress.blinding <== blinding;

    component checkEq = ForceEqualIfEnabled();
    checkEq.enabled <== stealthAddress;
    checkEq.in[0] <== xAddress.out;
    checkEq.in[1] <== stealthAddress;
}