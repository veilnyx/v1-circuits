pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template StealthSeed() {
    signal input viewKey;
    signal output out;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== viewKey;
    out <== hasher.out;
}