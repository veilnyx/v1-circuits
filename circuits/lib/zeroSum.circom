pragma circom 2.0.0;

template ZeroSum(nIns, nOuts) {
    signal input inValue[nIns];
    signal input outValue[nOuts];
    signal input inPublicValue;
    signal input outPublicValue;

    var inValueSum = 0;
    for (var i = 0; i < nIns; i++) {
        inValueSum += inValue[i];
    }

    var outValueSum = 0;
    for (var i = 0; i < nOuts; i++) {
        outValueSum += outValue[i];
    }

    inPublicValue + inValueSum === outPublicValue + outValueSum;
}