pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Address() {
    signal input publicKey[2]; // (P.x, P.y)
    signal output out;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== publicKey[0];
    hasher.inputs[1] <== publicKey[1];

    out <== hasher.out;
}