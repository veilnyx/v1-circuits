pragma circom 2.1.5;

include "../../lib/linkTx.circom";

component main { public [
    root,
    nullifiers   
]} = LinkTx(32, 1);