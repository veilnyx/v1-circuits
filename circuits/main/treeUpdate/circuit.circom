// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;

include "../../lib/treeUpdate.circom";

component main { public [ 
    leafIndex,
    leaves,
    lastRoot,
    lastSubtrees,
    newRoot,
    newSubtrees,
    nZeroLeaves
]} = TreeUpdate(25, 10);