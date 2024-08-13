pragma circom 2.1.5;

include "../../lib/treeUpdate.circom";

component main { public [ 
    leafIndex,
    leaves,
    lastRoot,
    lastSubtrees,
    newRoot,
    newSubtrees
]} = TreeUpdate(25, 10);