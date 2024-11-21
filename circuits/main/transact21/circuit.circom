pragma circom 2.1.6;

include "../../lib/transact.circom";

component main { public [ 
    addressTreeRoot,                        // len: 1
    commitmentTreeRoot,                     // len: 1
    hash,                                   // len: 1
    pubFlow,                                // len: 1
    pubAssetIds,                            // len: nOuts
    pubValues,                              // len: nOuts
    inNullifiers,                           // len: nIns
    outRevokerPublicKey,                    // len: 2
    outCommitments,                         // len: nOuts
    refundAddress,                          // len: 1
    keySeedEncryptionPublicKey,             // len: 2
    encryptedDataEncryptionKeySeed,         // len: 3
    encryptedRefundData,                    // len: 4
    encryptedNoteData                       // len: nOuts * 4
]} = Transact(20, 25, 2, 1);                // total: 16 + 7 * nOuts + nIns