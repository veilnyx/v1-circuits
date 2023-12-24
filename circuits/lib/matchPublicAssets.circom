pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";

template MatchPublicAssets(n) {
    signal input publicAssetIds[n];
    signal input outAssetIds[n];

    component forceSameAssetIds[n];
    for (var i = 0; i < n; i++) {
        forceSameAssetIds[i] = ForceEqualIfEnabled();
        forceSameAssetIds[i].enabled <== publicAssetIds[i];
        forceSameAssetIds[i].in[0] <== outAssetIds[i];
        forceSameAssetIds[i].in[1] <== publicAssetIds[i];
    }
}