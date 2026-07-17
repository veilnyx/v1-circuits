// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;

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

    // Store computed NFT counts in intermediate signals
    signal totalInNftCount;
    signal totalOutNftCount;
    
    totalInNftCount <== inCountNft.out + (1 - pubFlow) * publicCountNft.out;
    totalOutNftCount <== outCountNft.out + pubFlow * publicCountNft.out;
    
    // ForceEqualIfEnabled
    // Enforce unit count constraints when non-fungible
    (totalInNftCount - 1) * isNonFungible.out === 0;
    (totalOutNftCount - 1) * isNonFungible.out === 0;
}