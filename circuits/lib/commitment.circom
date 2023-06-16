pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Commitment() {
    signal input assetId;
    signal input address;
    signal input value;
    signal input salt;
    signal output out;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== assetId;
    hasher.inputs[1] <== address;
    hasher.inputs[2] <== value;
    hasher.inputs[3] <== salt;

    out <== hasher.out;
}