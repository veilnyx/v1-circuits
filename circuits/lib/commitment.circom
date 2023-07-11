pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Commitment() {
    signal input assetId;
    signal input owner;
    signal input value;
    signal input salt;
    signal output out;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== assetId;
    hasher.inputs[1] <== owner;
    hasher.inputs[2] <== value;
    hasher.inputs[3] <== salt;

    out <== hasher.out;
}