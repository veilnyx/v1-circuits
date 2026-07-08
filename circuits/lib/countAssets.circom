pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";

template CountAssets(n) {
    signal input selectedAssetId;
    signal input selectedAssetValue;
    signal input assetIds[n];
    signal input values[n];

    signal output out;

    component isEqId[n];
    component isEqValue[n];
    signal accumulator[n + 1];
    accumulator[0] <== 0;

    for (var i = 0; i < n; i++) {
        isEqId[i] = IsEqual();
        isEqId[i].in[0] <== selectedAssetId;
        isEqId[i].in[1] <== assetIds[i];

        isEqValue[i] = IsEqual();
        isEqValue[i].in[0] <== selectedAssetValue;
        isEqValue[i].in[1] <== values[i];

        accumulator[i + 1] <== accumulator[i] + isEqId[i].out * isEqValue[i].out;
    }

    out <== accumulator[n];
}