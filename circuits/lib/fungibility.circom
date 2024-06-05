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

    component isGt = GreaterThan(24);
    isGt.in[0] <== assetId;
    isGt.in[1] <== 0x01ffff;

    out <== isGt.out;
}