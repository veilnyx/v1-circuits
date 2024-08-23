pragma circom 2.1.5;

include "../../lib/register.circom";

component main { public [ 
    rootAddress,
    signPublicKey,
    viewPublicKey,
]} = Register();