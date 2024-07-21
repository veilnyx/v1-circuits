pragma circom 2.1.5;

include "../../lib/subtreeUpdate.circom";

component main { public [ 
    leafIndex,
    leaves,
    lastRoot,
    lastSubtree,
    newRoot,
    newSubtree
]} = SubtreeUpdate(25, 10);