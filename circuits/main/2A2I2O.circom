pragma circom 2.1.5;

include "../lib/multiTransact.circom";

component main { public [root, assetId, inPublicValue, inNullifier, outPublicValue, outCommitment, dataHash] } = MultiTransact(24, 2, 2, 2);