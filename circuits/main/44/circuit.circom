pragma circom 2.1.5;

include "../../lib/transact.circom";

component main { public [ 
    merkleRoot,             // len: 1
    hash,                   // len: 1
    pubFlow,                // len: 1
    pubAssetIds,            // len: nOuts
    pubValues,              // len: nOuts
    inNullifiers,           // len: nIns
    outCommitments,         // len: nOuts
    beneficiary,            // len: 1
    encPubKey,              // len: 2
    ephPubKey,              // len: 2
    encInPublicKeyX,        // len: 1
    encBeneficiaryBlinding, // len: 1
    encOutAssets,           // len: nOuts
    encOutBlindings,        // len: nOuts
    encOutPublicKeyXs       // len: nOuts
]} = Transact(32, 4, 4);    // total: 10 + nIns + 6 * nOuts