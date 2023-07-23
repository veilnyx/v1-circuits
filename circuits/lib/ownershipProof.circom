pragma circom 2.1.5;

// include "../../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "./schnorr.circom";

template OwnershipProof() {
    signal input commitment;
    signal input publicKey[2];
    signal input signature[2];

    component schnorr = SchnorrPoseidon();

    schnorr.enabled <== 1;
    schnorr.M <== commitment;
    schnorr.Ax <== publicKey[0];
    schnorr.Ay <== publicKey[1];
    schnorr.s <== signature[0];
    schnorr.e <== signature[1];

}
