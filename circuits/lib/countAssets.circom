pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";

template CountAssets(n) {
    signal input selectedAssetId;
    signal input selectedAssetValue;
    signal input assetIds[n];
    signal input values[n];

    signal output out;

    signal intermediates[n+1];
    intermediates[0] <== 0;
    component isEqId[n];
    component isEqValue[n];

    for (var i = 0; i < n; i++) {
        isEqId[i] = IsEqual();
        isEqId[i].in[0] <== selectedAssetId;
        isEqId[i].in[1] <== assetIds[i];

        isEqValue[i] = IsEqual();
        isEqValue[i].in[0] <== selectedAssetValue;
        isEqValue[i].in[1] <== values[i];

        intermediates[i+1] <== intermediates[i] + isEqId[i].out * isEqValue[i].out;
    }

    out <== intermediates[n];
}