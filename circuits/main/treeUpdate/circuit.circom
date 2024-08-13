pragma circom 2.1.5;

include "../../lib/treeUpdate.circom";

component main { public [ 
    leafIndex,
    leaves,
    lastRoot,
    lastSubtree,
    newRoot,
    newSubtree
]} = treeUpdate(25, 10);