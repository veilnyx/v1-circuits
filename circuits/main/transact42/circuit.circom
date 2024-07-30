pragma circom 2.1.5;

include "../../lib/transact.circom";

component main { public [ 
    addressTreeRoot,                // len: 1
    commitmentTreeRoot,             // len: 1
    hash,                           // len: 1
    pubFlow,                        // len: 1
    pubAssetIds,                    // len: nOuts
    pubValues,                      // len: nOuts
    inNullifiers,                   // len: nIns
    outRevokerPublicKey,            // len: 2
    outCommitments,                 // len: nOuts
    refundAddress,                  // len: 1
    keyEncryptionPublicKey,         // len: 2
    encryptedData                   // len: 2 + 1 + 3*nOuts + 2 + 2
]} = Transact(20, 25, 2, 2);        // total: 16 + nIns + 6 * nOuts