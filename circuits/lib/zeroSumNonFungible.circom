pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "./countAssets.circom";
include "./fungibility.circom";

template ZeroSumNonFungible(nIns, nOuts) {
    signal input pubFlow;
    signal input assetId;
    signal input nftId;
    signal input inAssetIds[nIns];
    signal input inValues[nIns];
    signal input outAssetIds[nOuts];
    signal input outValues[nOuts];
    signal input pubAssetIds[nOuts];
    signal input pubValues[nOuts];

    // Count the unique NFTs in the inputs
    component inCountNft = CountAssets(nIns);
    inCountNft.selectedAssetId <== assetId;
    inCountNft.selectedAssetValue <== nftId;
    inCountNft.assetIds <== inAssetIds;
    inCountNft.values <== inValues;

    // Count the unique NFTs in the outputs
    component outCountNft = CountAssets(nOuts);
    outCountNft.selectedAssetId <== assetId;
    outCountNft.selectedAssetValue <== nftId;
    outCountNft.assetIds <== outAssetIds;
    outCountNft.values <== outValues;

    // Count the unique NFTs in the public assets
    component publicCountNft = CountAssets(nOuts);
    publicCountNft.selectedAssetId <== assetId;
    publicCountNft.selectedAssetValue <== nftId;
    publicCountNft.assetIds <== pubAssetIds;
    publicCountNft.values <== pubValues;

    component isNonFungible = IsNonFungible();
    isNonFungible.assetId <== assetId;

    component inForceEqualIfNonFungible = ForceEqualIfEnabled();
    inForceEqualIfNonFungible.enabled <== isNonFungible.out;
    inForceEqualIfNonFungible.in[0] <== inCountNft.out + (1 - pubFlow) * publicCountNft.out;
    inForceEqualIfNonFungible.in[1] <== 1;

    component outForceEqualIfNonFungible = ForceEqualIfEnabled();
    outForceEqualIfNonFungible.enabled <== isNonFungible.out;
    outForceEqualIfNonFungible.in[0] <== outCountNft.out + pubFlow * publicCountNft.out;
    outForceEqualIfNonFungible.in[1] <== 1;
}