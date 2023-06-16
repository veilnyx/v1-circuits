pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/switcher.circom";

template MerkleProof(nLevels) {
    signal input root;
    signal input leaf;
    signal input pathElements[nLevels];
    signal input pathIndices;

    component switcher[nLevels];
    component hasher[nLevels];

    component indexBits = Num2Bits(nLevels);
    indexBits.in <== pathIndices;

    for (var i = 0; i < nLevels; i++) {
        switcher[i] = Switcher();
        switcher[i].L <== i == 0 ? leaf : hasher[i - 1].out;
        switcher[i].R <== pathElements[i];
        switcher[i].sel <== indexBits.out[i];

        hasher[i] = Poseidon(2);
        hasher[i].inputs[0] <== switcher[i].outL;
        hasher[i].inputs[1] <== switcher[i].outR;
    }

    root === hasher[nLevels - 1].out;
}
