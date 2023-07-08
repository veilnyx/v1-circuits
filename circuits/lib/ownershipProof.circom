pragma circom 2.0.0;

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
    schnorr.S <== signature[0];
    schnorr.e <== signature[1];

}

// template OwnershipProof() {
//     signal input commitment;
//     signal input publicKey[2];
//     signal input signature[3];

//     component eddsa = EdDSAPoseidonVerifier();

//     eddsa.enabled <== 1;
//     eddsa.M <== commitment;
//     eddsa.Ax <== publicKey[0];
//     eddsa.Ay <== publicKey[1];
//     eddsa.R8x <== signature[0];
//     eddsa.R8y <== signature[1];
//     eddsa.S <== signature[2];
// }