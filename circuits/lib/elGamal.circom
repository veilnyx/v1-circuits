pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

// Using encoding free hashed el gamal encryption that uses addition
// See: https://www.di.ens.fr/david.pointcheval/Documents/Papers/2006_pkcC.pdf
template ElGamalEncrypt() {
    // Ephemeral key, (r)
    signal input ephemeralKey;

    // Ephemeral public key (R)
    signal input ephemeralPublicKey[2];

    // Encryption key (P)
    signal input encryptionPublicKey[2];

    // Message
    signal input m;

    // Ciphertext
    signal output out;

    // Base point (G) (https://eips.ethereum.org/EIPS/eip-2494)
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    // Subgroup order (https://eips.ethereum.org/EIPS/eip-2494)
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    component ephemeralKeyBits = Num2Bits_strict();
    ephemeralKeyBits.in <== ephemeralKey;

    // Assert r < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER - 1);
    comp.in <== ephemeralKeyBits.out;
    comp.out === 0;

    // Caclulate R = r.G
    component ephemeralKeyMulG = EscalarMulAny(254);
    ephemeralKeyMulG.e <== ephemeralKeyBits.out;
    ephemeralKeyMulG.p <== BASE8;
    ephemeralPublicKey === ephemeralKeyMulG.out;

    // Calculate r.P
    component ephemeralKeyMulP = EscalarMulAny(254);
    ephemeralKeyMulP.e <== ephemeralKeyBits.out;
    ephemeralKeyMulP.p <== encryptionPublicKey;

    // Calculate shared secret, h = H(r.P)
    component ephemeralKeyMulPHash = Poseidon(2);
    ephemeralKeyMulPHash.inputs[0] <== ephemeralKeyMulP.out[0];
    ephemeralKeyMulPHash.inputs[1] <== ephemeralKeyMulP.out[1];

    // Assign out = m + h
    out <== m + ephemeralKeyMulPHash.out;
}
