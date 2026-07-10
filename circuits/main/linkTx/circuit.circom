// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.5;

include "../../lib/linkTx.circom";

component main { public [
    root,
    nullifiers   
]} = LinkTx(32, 1);