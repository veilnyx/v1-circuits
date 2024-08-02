pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "./ecc.circom";
include "./utils.circom";
include "./elGamal.circom";
include "./encodeAsset.circom";
include "./poseidonCipher.circom";

template DecryptNote() {
    // asset, rootAddress and blinding
    var plainDataLen = 3;

    signal input key[2];
    // Poseidon cipher produces 4 element ciphertext for 3 element plaintext
    signal input encryptedNote[plainDataLen + 1];
    signal output out[plainDataLen];

    component poseidonDecrypt = PoseidonDecrypt(plainDataLen);
    poseidonDecrypt.nonce <== 0;
    poseidonDecrypt.key <== key;
    poseidonDecrypt.ciphertext <== encryptedNote;

    out <== poseidonDecrypt.decrypted;
}

template DecryptSenderData() {
    // rootAddress and blinding
    var plainDataLen = 2;

    signal input key[2];
    // Poseidon cipher produces 4 element ciphertext for 2 element plaintext
    signal input encryptedSenderData[plainDataLen + 2];

    // Output is multiple of 3
    signal output out[plainDataLen + 1];

    component poseidonDecrypt = PoseidonDecrypt(plainDataLen);
    poseidonDecrypt.nonce <== 0;
    poseidonDecrypt.key <== key;
    poseidonDecrypt.ciphertext <== encryptedSenderData;

    out <== poseidonDecrypt.decrypted;
}

template DeriveKeys(n) {
    signal input seed;
    signal output out[n][2];

    signal intermediateKeys[n + 1];
    intermediateKeys[0] <== seed;

    component hashers[n];
    for (var i = 0; i < n; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== i;
        hashers[i].inputs[1] <== intermediateKeys[i];
        intermediateKeys[i + 1] <== hashers[i].out;
    }

    component castToBits[n];
    component pvtToPubKey[n];
    for (var i = 0; i < n; i++) {
        castToBits[i] = CastToBits(248);
        castToBits[i].in <== intermediateKeys[i + 1];

        pvtToPubKey[i] = PrivateKeyToPublicKey();
        pvtToPubKey[i].privateKey <== castToBits[i].out;

        out[i] <== pvtToPubKey[i].out;
    }
}

template ComplianceProof(n) {
    signal input keySeedEncryptionEphemeralKey;
    signal input keySeedEncryptionPublicKey[2];
    signal input dataEncryptionKeySeed;
    signal input senderData[2];
    signal input noteData[n][3];

    signal input encryptedDataEncryptionKeySeed[3];
    signal input encryptedSenderData[4];
    signal input encryptedNoteData[n][4];

    // Check encryption of key used for data encryption
    component elGamalEncrypt = ElGamalEncrypt();
    elGamalEncrypt.ephemeralKey <== keySeedEncryptionEphemeralKey;
    elGamalEncrypt.ephemeralPublicKey[0] <== encryptedDataEncryptionKeySeed[0];
    elGamalEncrypt.ephemeralPublicKey[1] <== encryptedDataEncryptionKeySeed[1];
    elGamalEncrypt.encryptionPublicKey <== keySeedEncryptionPublicKey;
    elGamalEncrypt.m <== dataEncryptionKeySeed;
    elGamalEncrypt.out === encryptedDataEncryptionKeySeed[2];

    component dataEncryptionKeys = DeriveKeys(n + 1);
    dataEncryptionKeys.seed <== dataEncryptionKeySeed;

    component senderDataDecryption = DecryptSenderData();
    senderDataDecryption.key <== dataEncryptionKeys.out[0];
    senderDataDecryption.encryptedSenderData <== encryptedSenderData;
    senderData[0] === senderDataDecryption.out[0];
    senderData[1] === senderDataDecryption.out[1];    

    component noteDecryptions[n];
    for (var i = 0; i < n; i++) {
        noteDecryptions[i] = DecryptNote();
        noteDecryptions[i].key <== dataEncryptionKeys.out[i + 1];
        noteDecryptions[i].encryptedNote <== encryptedNoteData[i];
        noteData[i] === noteDecryptions[i].out;
    }
}
