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
    signal input protocolFeeAssetIds[nOuts];
    signal input protocolFeeValues[nOuts];
    
    signal isInflow <== 1 - pubFlow;

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

    // Sum protocol values with asset id equal to `assetId`
    component protocolFeeSum = SumValues(nOuts);
    protocolFeeSum.selectedAssetId <== assetId;
    protocolFeeSum.assetIds <== protocolFeeAssetIds;
    protocolFeeSum.values <== protocolFeeValues;

    component isFungible = IsFungible();
    isFungible.assetId <== assetId;

    component forceEqualIfFungible = ForceEqualIfEnabled();
    forceEqualIfFungible.enabled <== isFungible.out;

    signal totalInputValue <== inSumValues.out + isInflow * publicSumValues.out;
    log("Total input value:");
    log(totalInputValue);

    signal totalOutputValue <== outSumValues.out + (1 - isInflow) * publicSumValues.out + protocolFeeSum.out;
    log("Total output value:");
    log(totalOutputValue);

    forceEqualIfFungible.in[0] <== totalInputValue;
    forceEqualIfFungible.in[1] <== totalOutputValue;
}