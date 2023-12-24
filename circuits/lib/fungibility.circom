pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";

template IsFungible() {
    signal input assetId;
    signal output out;

    component isLt = LessThan(24);
    isLt.in[0] <== assetId;
    isLt.in[1] <== 0x020000;

    out <== isLt.out;
}

template IsNonFungible() {
    signal input assetId;
    signal output out;

    component isGte = GreaterThan(24);
    isGte.in[0] <== assetId;
    isGte.in[1] <== 0x01ffff;

    out <== isGte.out;
}