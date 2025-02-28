pragma circom 2.1.6;
include "../../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

// Helper template to convert an array of numbers to bits and hash it along with a prev hash
template ConvertAndHash(chunkSize) {
    signal input prev;  
    signal input nums[chunkSize];
    signal output out;  

    // Calculate proper SHA-256 input size
    var bitsPerNum = 256;
    var totalBits = (chunkSize + 1) * bitsPerNum;

    component hasher = Sha256(totalBits);
    component num2Bits[chunkSize];
    component numsRe[chunkSize];
    var offset = 0;

    // Convert prev to bits and add to hasher input
    component prevNum2Bits = Num2Bits(254);
    prevNum2Bits.in <== prev;

    hasher.in[0] <== 0;
    hasher.in[1] <== 0;
    
    // Handle prev value in the same byte order as Solidity/TS
    for(var j = 0; j < 254; j++) {
        hasher.in[j + 2] <== prevNum2Bits.out[253 - j];
    }

    offset += 256;

    // Process current chunk in same byte order
    for(var i = 0; i < chunkSize; i++) {
        num2Bits[i] = Num2Bits(254);
        num2Bits[i].in <== nums[i];
            
        hasher.in[offset] <== 0;
        hasher.in[offset + 1] <== 0;
        
        for(var j = 0; j < 254; j++) {
            hasher.in[offset + 2 + j] <== num2Bits[i].out[253 - j];
        }

        offset += 256;
    }

    // Convert hash output to field element (maintain original byte order)
    component bits2Num = Bits2Num(256);
    for(var i = 0; i < 256; i++) {
        bits2Num.in[i] <== hasher.out[255 - i];
    }
    out <== bits2Num.out;
}

template HashEncryptedDataSha256(nOuts) {
    signal input encryptedDataEncryptionKeySeed[3];
    signal input encryptedRefundData[4];
    signal input encryptedNoteData[nOuts][4];
    signal output out;

    // Hash key seed (3 elements)
    component keySeedHasher = ConvertAndHash(3);
    keySeedHasher.prev <== 0;  // Initial value
    
    log("Circuit::input::encryptedDEKSeed elements:");
    for(var i = 0; i < 3; i++) {
        log(encryptedDataEncryptionKeySeed[i]);
        keySeedHasher.nums[i] <== encryptedDataEncryptionKeySeed[i];
    }

    var currentHash = keySeedHasher.out;
    log("circuit::encryptedDEKSeedHash:");
    log(currentHash);

    // Hash refund data (4 elements)
    component refundHasher = ConvertAndHash(4);
    refundHasher.prev <== currentHash;
    
    log("Circuit::inputs:encryptedRefundData elements");
    for(var i = 0; i < 4; i++) {
        log(encryptedRefundData[i]);
        refundHasher.nums[i] <== encryptedRefundData[i];
    }

    currentHash = refundHasher.out;
    log("circuit::encryptedRefundDataHash:");
    log(currentHash);

    // Hash note data in chunks of 4
    component noteHasher[nOuts];

    log("circuit::inputs::encryptedNoteData elements:");
    for(var i = 0; i < nOuts; i++) {
        log("circuit::inputs::single note elements:");
        
        noteHasher[i] = ConvertAndHash(4);
        noteHasher[i].prev <== currentHash;

        for(var j = 0; j < 4; j++) {
        log(encryptedNoteData[i][j]);
        noteHasher[i].nums[j] <== encryptedNoteData[i][j];
        }

        currentHash = noteHasher[i].out;
    }
    log("circuit::encryptedNoteDataHash:");
    log(currentHash);

    out <== currentHash;
}