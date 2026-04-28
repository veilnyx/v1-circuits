pragma circom 2.1.6;

template UHF(inputCount) {
    signal input encryptedInputs[inputCount];
    signal input alpha;
    signal input beta;
    signal output gamma;

    signal coefficientPowers[inputCount + 1];
    coefficientPowers[0] <== 1;
    signal products[inputCount];
    signal accumulator[inputCount + 1];
    accumulator[0] <== 0;
    
    for(var i = 0; i < inputCount; i++) {
        products[i] <== encryptedInputs[i] * coefficientPowers[i];
        accumulator[i+1] <== accumulator[i] + products[i];
        coefficientPowers[i+1] <== coefficientPowers[i] * (alpha + beta);
    }

    gamma <== accumulator[inputCount];
}