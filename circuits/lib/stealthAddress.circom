pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template StealthAddress() {
    signal input publicKey[2]; 
    signal input stealthSeed;
    signal output out;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== publicKey[0];
    hasher.inputs[1] <== publicKey[1];
    hasher.inputs[2] <== stealthSeed;

    out <== hasher.out;
}