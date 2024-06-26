pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/babyjub.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/pointbits.circom";
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
    signal input c;

    // Base point (G) (https://eips.ethereum.org/EIPS/eip-2494)
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    // Subgroup order (https://eips.ethereum.org/EIPS/eip-2494)
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    component ephemeralKeyBits = Num2Bits(254);
    ephemeralKeyBits.in <== ephemeralKey;

    // Assert r < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER);
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

    // Calculate h = H(r.P)
    component ephemeralKeyMulPHash = Poseidon(2);
    ephemeralKeyMulPHash.inputs[0] <== ephemeralKeyMulP.out[0];
    ephemeralKeyMulPHash.inputs[1] <== ephemeralKeyMulP.out[1];

    // Assert c = m + h
    c === m + ephemeralKeyMulPHash.out;
}

// Re-uses randomness to encrypt multiple messages
// See: https://www.iacr.org/archive/pkc2003/25670085/25670085.pdf
// @todo Assess security of this scheme
//  - What if m = 0 (e.g. for dummy notes). h = c in that case. @todo fix
//      - change def of dummy notes: dummy note has assetId=0 & any value
template ElGamalEncryptMulti(n) {
    // Ephemeral key, (r)
    signal input ephemeralKey;

    // Ephemeral public key (R)
    signal input ephemeralPublicKey[2];

    // Encryption key (P)
    signal input encryptionPublicKey[2];

    // Enable switches
    signal input enabled[n];

    // Message
    signal input m[n];

    // Ciphertext
    signal input c[n];

    // Base point (G) (https://eips.ethereum.org/EIPS/eip-2494)
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    // Subgroup order (https://eips.ethereum.org/EIPS/eip-2494)
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    component ephemeralKeyBits = Num2Bits(254);
    ephemeralKeyBits.in <== ephemeralKey;

    // Assert r < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER);
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

    // Calculate h = H(r.P)
    component ephemeralKeyMulPHash = Poseidon(2);
    ephemeralKeyMulPHash.inputs[0] <== ephemeralKeyMulP.out[0];
    ephemeralKeyMulPHash.inputs[1] <== ephemeralKeyMulP.out[1];

    // Assert c = m + h
    component checkEq[n];
    for (var i = 0; i < n; i++) {
        checkEq[i] = ForceEqualIfEnabled();
        checkEq[i].enabled <== enabled[i];
        checkEq[i].in[0] <== c[i];
        checkEq[i].in[1] <== m[i] + ephemeralKeyMulPHash.out;
    }
}

