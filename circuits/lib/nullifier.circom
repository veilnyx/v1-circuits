pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Nullifier() {
    signal input pathIndices;
    signal input signature[3];
    signal output out;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== pathIndices;
    hasher.inputs[1] <== signature[0];
    hasher.inputs[2] <== signature[1];
    hasher.inputs[3] <== signature[2];

    out <== hasher.out;
}