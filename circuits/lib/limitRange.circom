pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/bitify.circom";

template LimitRange(maxBits) {
    signal input in;

    assert(maxBits < 254);
    
    component bitifier = Num2Bits(maxBits);
    bitifier.in <== in;
}