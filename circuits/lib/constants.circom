// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.6;

// secp256k1 base point (https://eips.ethereum.org/EIPS/eip-2494)
function GetBase8Point() {
    return [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
}

// secp256k1 subgroup order
function GetSubgroupOrder() {
    return 2736030358979909402780800718157159386076813972158567259200215660948447373041;
}

// assetValue max size can be 28 bytes and assetId's 3 bytes = 31 bytes total for assetID+assetValue
function GetMaxBitValue() {
    return 224;
}
