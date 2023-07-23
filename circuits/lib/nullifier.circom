pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Nullifier() {
    signal input pathIndices;
    signal input signature[2];
    signal output out;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== pathIndices;
    hasher.inputs[1] <== signature[0];
    hasher.inputs[2] <== signature[1];

    out <== hasher.out;
}