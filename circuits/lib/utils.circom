pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";

template CastToBits(nOut) {
    signal input in;
    signal output out;

    assert(nOut < 254);

    component nToB = Num2Bits(254);
    nToB.in <== in;

    component bToN = Bits2Num(nOut);
    for (var i = 0; i < nOut; i++) {
        bToN.in[i] <== nToB.out[i];
    }

    out <== bToN.out;
}

template LimitRange(maxBits) {
    signal input in;

    assert(maxBits < 254);
    
    component bitifier = Num2Bits(maxBits);
    bitifier.in <== in;
}