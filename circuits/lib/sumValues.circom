// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";

template SumValues(n) {
    signal input selectedAssetId;
    signal input assetIds[n];
    signal input values[n];

    signal output out;

    signal intermediates[n+1];
    intermediates[0] <== 0;
    component isEqValue[n];

    for (var i = 0; i < n; i++) {
        isEqValue[i] = IsEqual();
        isEqValue[i].in[0] <== selectedAssetId;
        isEqValue[i].in[1] <== assetIds[i];
        
        intermediates[i+1] <== intermediates[i] + isEqValue[i].out * values[i];
    }

    out <== intermediates[n];
}