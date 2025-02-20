pragma circom 2.1.5;
include "../../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

template HashEncryptedDataSha256(nOuts) {
    // Input signals
    signal input encryptedDataEncryptionKeySeed[3];
    signal input encryptedRefundData[4];
    signal input encryptedNoteData[nOuts][4];

    signal output out;

    var totalNums = 3 + 4 + nOuts * 4;
    var numCounter = 0;
    component num2Bits[totalNums]; // will store each num in bits
    

    // 1. Converting encryptedDataEncryptionKeySeed number to bits
    for(var i = 0; i < 3; i++) {
        num2Bits[numCounter] = Num2Bits(254); // Using 254 bits for each number/element
        num2Bits[numCounter].in <== encryptedDataEncryptionKeySeed[i];
        numCounter++;
    }

    // 2. Converting encryptedRefundData numbers to bits
    for(var i = 0; i < 4; i++) {
        num2Bits[numCounter] = Num2Bits(254);
        num2Bits[numCounter].in <== encryptedRefundData[i];
        numCounter++;
    }

    // 3. Converting encryptedNoteData numbers to bits
    for(var i = 0; i < nOuts; i++) {
        for(var j = 0; j < 4; j++) {
            num2Bits[numCounter] = Num2Bits(254);
            num2Bits[numCounter].in <== encryptedNoteData[i][j];
            numCounter++;
        }
    }

    // Concatenate all bits for Sha256 input
     var totalBits = totalNums * 254;
    component sha256Hasher = Sha256(totalBits); // will accept all num in bits format for hashing

    var offset = 0;
    for(var i = 0; i < totalNums; i++) {
        for(var j = 0; j < 254; j++) {
            sha256Hasher.in[offset + j] <== num2Bits[i].out[j];
        }
        offset += 254;
    }

    component bits2Num = Bits2Num(256);
    for(var i = 0; i < 256; i++) {
        bits2Num.in[i] <== sha256Hasher.out[i];
    }
    
    out <== bits2Num.out;
}