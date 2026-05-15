pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";

template SchnorrVerify() { 
    signal input enabled; 

    // Message
    signal input m; 

    // Signing key (P)
    signal input publicKey[2];

    // Signature 
    signal input s; 
    signal input e;

    // Base point (G) (https://eips.ethereum.org/EIPS/eip-2494)
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    // Subgroup order (https://eips.ethereum.org/EIPS/eip-2494)
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    component sbits = Num2Bits_strict();
    sbits.in <== s;

    component ebits = Num2Bits_strict();
    ebits.in <== e;

    // Assert s < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER - 1);
    comp.in <== sbits.out;
    comp.out * enabled === 0;

    // Calculate s.G
    component sMulG = EscalarMulAny(254);
    sMulG.e <== sbits.out;
    sMulG.p <== BASE8;

    // Calculate e.P
    component eMulP = EscalarMulAny(254);
    eMulP.e <== ebits.out;
    eMulP.p <== publicKey;

    // Calculate s.G + e.P
    component add = BabyAdd();
    add.x1 <== sMulG.out[0];
    add.y1 <== sMulG.out[1];
    add.x2 <== eMulP.out[0];
    add.y2 <== eMulP.out[1];

    // Calculate h = H(s.G + e.P, m)
    component addHash = Poseidon(3);
    addHash.inputs[0] <== add.xout;
    addHash.inputs[1] <== add.yout;
    addHash.inputs[2] <== m;

    // Assert h = e
    component eqCheck = ForceEqualIfEnabled();
    eqCheck.enabled <== enabled;
    eqCheck.in[0] <== e;
    eqCheck.in[1] <== addHash.out;
}