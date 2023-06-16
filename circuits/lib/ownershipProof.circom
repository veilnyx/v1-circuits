pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/eddsaposeidon.circom";

template OwnershipProof() {
    signal input commitment;
    signal input publicKey[2];
    signal input signature[3];

    component eddsa = EdDSAPoseidonVerifier();

    eddsa.enabled <== 1;
    eddsa.M <== commitment;
    eddsa.Ax <== publicKey[0];
    eddsa.Ay <== publicKey[1];
    eddsa.R8x <== signature[0];
    eddsa.R8y <== signature[1];
    eddsa.S <== signature[2];
}