// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.5;

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

    
    signal totalInSumValues;
    signal totalOutSumValues;
    totalInSumValues <== inSumValues.out + (1 - pubFlow) * publicSumValues.out;
    totalOutSumValues <== outSumValues.out + pubFlow * publicSumValues.out;
    
    // ForceEqualIfEnabled
    // Enforce zero-sum constraint when fungible
    (totalOutSumValues - totalInSumValues) * isFungible.out === 0;
}