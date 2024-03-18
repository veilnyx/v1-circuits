pragma circom 2.1.5;

include "../../lib/transact.circom";

component main { public [ 
    merkleRoot, 
    hash, 
    pubFlow, 
    pubAssetIds,
    pubValues, 
    inNullifiers, 
    outCommitments, 
    ephPubKey,
    encPubKey, 
    encAssets
] } = Transact(24, 2, 2);