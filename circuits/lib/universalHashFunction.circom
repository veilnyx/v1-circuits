pragma circom 2.1.6;

template UHF(inputCount) {
    signal input encryptedInputs[inputCount];
    signal input alpha;
    signal input beta;
    signal output gamma;

    signal accumulator[inputCount + 1];
    accumulator[0] <== 0;
    
    signal coeff[inputCount + 1];
    coeff[0] <== 1;

    for(var i = 0; i < inputCount; i++) {
        accumulator[i + 1] <== accumulator[i] + encryptedInputs[i] * coeff[i];
        coeff[i + 1] <== coeff[i] * (alpha + beta);
    }

    gamma <== accumulator[inputCount];
}