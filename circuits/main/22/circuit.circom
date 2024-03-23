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
    encPubKey, 
    ephPubKey,
    encAssets,
    encBlindings,
    encPublicKeyXs
]} = Transact(32, 2, 2);