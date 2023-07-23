pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Nullifier() {
    signal input pathIndices;
    signal input commitment;
    signal input viewKey;
    signal output out;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== pathIndices;
    hasher.inputs[1] <== commitment;
    hasher.inputs[2] <== viewKey;

    out <== hasher.out;
}