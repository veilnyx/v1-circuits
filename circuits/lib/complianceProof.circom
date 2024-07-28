pragma circom 2.1.5;

include "./ecc.circom";
include "./elGamal.circom";
include "./encodeAsset.circom";
include "./poseidonCipher.circom";

template ComplianceProof(n) {
    signal input ephemeralKey;
    signal input keyEncryptionPublicKey[2];
    signal input dataEncryptionPrivateKey;

    // n notes with 3 elements each and 2 additional elements - 
    // sender root address & refund address blinding
    var plainDataLen = 3*n + 2;

    // poseidon encryption output size for 3*n + 2 elements (3*n + 2 + 2 elements)
    var poseidonCiphertextLen = 3*n + 2 + 2;

    // Ephemeral public key (2 elements)
    // + encrypted data encryption private key (1 element)
    // + poseidon encryption outputs (3*n + 2 + 2 elements)
    var ciphertextLen = 2 + 1 + poseidonCiphertextLen;

    signal input plainData[plainDataLen];
    signal input encryptedData[ciphertextLen];

    // Check encryption of key used for data encryption
    component elGamalEncrypt = ElGamalEncrypt();
    elGamalEncrypt.ephemeralKey <== ephemeralKey;
    elGamalEncrypt.ephemeralPublicKey[0] <== encryptedData[0];
    elGamalEncrypt.ephemeralPublicKey[1] <== encryptedData[1];
    elGamalEncrypt.encryptionPublicKey <== keyEncryptionPublicKey;
    elGamalEncrypt.m <== dataEncryptionPrivateKey;
    elGamalEncrypt.out === encryptedData[2];

    component dataEncryptionPubliceKey = PrivateKeyToPublicKey();
    dataEncryptionPubliceKey.privateKey <== dataEncryptionPrivateKey;

    component poseidonDecrypt = PoseidonDecrypt(plainDataLen);
    poseidonDecrypt.nonce <== 0;
    poseidonDecrypt.key <== dataEncryptionPubliceKey.out;
    for (var i = 0; i < poseidonCiphertextLen; i++) {
        poseidonDecrypt.ciphertext[i] <== encryptedData[i + 3];
    }

    for (var i = 0; i < plainDataLen; i++) {
        poseidonDecrypt.decrypted[i] === plainData[i];
    }
}
