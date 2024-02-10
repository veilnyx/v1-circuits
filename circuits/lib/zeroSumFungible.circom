pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "./sumValues.circom";
include "./fungibility.circom";

template ZeroSumFungible(nIns, nOuts) {
    // Assumed `pubFlow` is either 0 (inflow) or 1 (outflow)
    signal input pubFlow;
    signal input assetId;
    signal input inAssetIds[nIns];
    signal input inValues[nIns];
    signal input outAssetIds[nOuts];
    signal input outValues[nOuts];
    signal input pubAssetIds[nOuts];
    signal input pubValues[nOuts];

    // Sum input notes values with asset id equal to `assetId`
    component inSumValues = SumValues(nIns);
    inSumValues.selectedAssetId <== assetId;
    inSumValues.assetIds <== inAssetIds;
    inSumValues.values <== inValues;

    // Sum output notes values with asset id equal to `assetId`
    component outSumValues = SumValues(nOuts);
    outSumValues.selectedAssetId <== assetId;
    outSumValues.assetIds <== outAssetIds;
    outSumValues.values <== outValues;

    // Sum public values with asset id equal to `assetId`
    component publicSumValues = SumValues(nOuts);
    publicSumValues.selectedAssetId <== assetId;
    publicSumValues.assetIds <== pubAssetIds;
    publicSumValues.values <== pubValues;

    component isFungible = IsFungible();
    isFungible.assetId <== assetId;

    component forceEqualIfFungible = ForceEqualIfEnabled();
    forceEqualIfFungible.enabled <== isFungible.out;
    forceEqualIfFungible.in[0] <== inSumValues.out + (1 - pubFlow) * publicSumValues.out;
    forceEqualIfFungible.in[1] <== outSumValues.out + pubFlow * publicSumValues.out;
}