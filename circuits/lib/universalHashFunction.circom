pragma circom 2.1.6;

template UHF(inputCount) {
    signal input encryptedInputs[inputCount];
    signal input alpha;
    signal output beta;

    signal alphaPowers[inputCount + 1];
    alphaPowers[0] <== 1;
    signal products[inputCount];
    signal accumulator[inputCount + 1];
    accumulator[0] <== 0;
    
    for(var i = 0; i < inputCount; i++) {
        products[i] <== encryptedInputs[i] * alphaPowers[i];
        accumulator[i+1] <== accumulator[i] + products[i];
        alphaPowers[i+1] <== alphaPowers[i] * alpha;
    }

    beta <== accumulator[inputCount];
}