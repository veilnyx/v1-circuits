pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/gates.circom";

template LessThanPow2(n, k) {
    signal input in;
    signal output out;
    
    component xBits = Num2Bits(n);
    xBits.in <== in;
    
    var hiBits = 0;
    for (var i = k; i < n; i++) {
        hiBits += xBits.out[i];
    }
    
    component hiBitsZero = IsZero();
    hiBitsZero.in <== hiBits;
    out <== hiBitsZero.out;
}

template GreaterThanPow2(n, k) {
    signal input in;
    signal output out;
    
    component xBits = Num2Bits(n);
    xBits.in <== in;
    
    var hiBits = 0;
    for (var i = k; i < n; i++) {
        hiBits += xBits.out[i];
    }
    
    component hiBitsZero = IsZero();
    hiBitsZero.in <== hiBits;
    out <== 1 - hiBitsZero.out;  // Output 1 if hiBits > 0
}

template IsFungible() {
    signal input assetId;
    signal output out;

    component isLt = LessThanPow2(24, 17);
    isLt.in <== assetId;

    out <== isLt.out;
}

template IsNonFungible() {
    signal input assetId;
    signal output out;

    component isGt = GreaterThanPow2(24, 17);
    isGt.in <== assetId;

    out <== isGt.out;
}