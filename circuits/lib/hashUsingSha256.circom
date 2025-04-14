pragma circom 2.1.5;
include "../../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

template HashUsingSha256() {
    signal input in;
    signal output out;

    // Step 1: Convert input field element to 254 bits
    component num2Bits = Num2Bits(254);
    num2Bits.in <== in;

    // Step 2: Add 2 zero bits at the beginning to make it 256 bits (32 bytes)
    component hasher = Sha256(256);
    
    // Add 2 zero bits at the beginning (most significant bits)
    hasher.in[0] <== 0;
    hasher.in[1] <== 0;
    
    // Copy 254 bits from num2Bits output in reverse order (to match big-endian)
    for(var i = 0; i < 254; i++) {
        hasher.in[i + 2] <== num2Bits.out[253 - i];
    }

    // Convert output bits back to field element (reversing order again)
    component bits2Num = Bits2Num(256);
    for(var i = 0; i < 256; i++) {
        bits2Num.in[i] <== hasher.out[255 - i];
    }

    log("Circuit sha256 input (addressTreeRoot):");
    log(in);
    log("Circuit sha256 output:");
    log(bits2Num.out);

    out <== bits2Num.out;
}