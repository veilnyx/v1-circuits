pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/switcher.circom";

template SubtreeUpdate(nLevels, nLeaves) {
    signal input leafIndex;
    signal input leaves[nLeaves];
    signal input lastRoot;
    signal input lastSubtree[nLevels];
    signal input newRoot;
    signal input newSubtree[nLevels];

    assert(nLeaves % 2 == 0);
    assert(leafIndex % 2 == 0);

    var nPairs = nLeaves / 2;

    signal intermediaryRoots[nPairs + 1];
    intermediaryRoots[0] <== lastRoot;
    
    signal intermediarySubtrees[nPairs + 1][nLevels];
    intermediarySubtrees[0] <== lastSubtree;

    component treeInsertions[nLeaves];
    for (var i = 0; i < nPairs; i++) {
        treeInsertions[i] = InsertLeavesPair(nLevels);
        treeInsertions[i].leafIndex <== leafIndex + (2*i);
        treeInsertions[i].leaves[0] <== leaves[2*i];
        treeInsertions[i].leaves[1] <== leaves[2*i + 1];
        treeInsertions[i].lastRoot <== intermediaryRoots[i];
        treeInsertions[i].lastSubtree <== intermediarySubtrees[i];

        intermediaryRoots[i + 1] <== treeInsertions[i].newRoot;
        intermediarySubtrees[i + 1] <== treeInsertions[i].newSubtree;
    }

    newRoot === intermediaryRoots[nPairs];
    newSubtree === intermediarySubtrees[nPairs];
}

template InsertLeavesPair(nLevels) {
    signal input leafIndex;
    signal input leaves[2];
    signal input lastRoot;
    signal input lastSubtree[nLevels];
    signal output newRoot;
    signal output newSubtree[nLevels];

    assert(leafIndex % 2 == 0);

    // Zeros generate from zero leaf: keccak256("zero")
    var ZEROES[32] = [
    18632411485870166338768840581683239832943220854620341531184981674745539224232,
    18402050153595289184280797556781086250076288378116456728293668677774828943192,
    14315801772090409316639992801223357219354013968351477383541832743181059554033,
    2957425831545851697186231637539599029072986388350466151437081470309199960039,
    15506538013195219498242914956854453986045640802387618943318292139922407598551,
    9694362127905248809280587035544966795158097935477356272887952915361062684175,
    18132575393932729332233395949571377960892513988506638172682485757438161805088,
    8146692135917290767179028926963145752176174667515588974232757150066543170585,
    2574610708301688732475379149822903318483568277840993563468179508041724503358,
    15170197785480409488033328501627558977412943975222505825984228314305846257883,
    21762600686646720388209764979078586121390243077946379902896618347462660885679,
    21344605055942438548701664872909221402376968186824056291401765272169638002242,
    12023362552146067117946607678154398068550172965905430258242903498088546607061,
    8539041574917839673807208217640370941591798826498227351699501536149286453120,
    18146364643245424628562292293808392483392811651026586697634167805672699068994,
    9537074208838805251610759631939164381000559864602420037669178332044510823951,
    7829789307619925792109997779684261776683339663526839018190526252642784998098,
    1576104152046545216913110733374353429881798274670998727578481395167370563672,
    14523789569241232282758578247970376517763749447507698167787728473396237341533,
    4492264168358352158060151139147865042840375508004441771192225088002467414647,
    4927386406150794518891481032696794585092345306503159677366101108479274242833,
    5816370588500910758401929078539096546250215732423945951480662330169750012447,
    6626801507450446276237804769630103862875806714387556281745256814833489189275,
    16952851231678662977529623361084371161706923936726875836661953397320258088735,
    12836514120017824258854027297904264437384169664414607914273993757039288719025,
    3420098610496884406880543028848481928148348058671764707661296398985659236059,
    21129839358812997871369640465846829367363760081634011945381946096779287613995,
    2628489686662140570433010792965324892561278189364963814231748198312045345470,
    15472074400217371627280651660337775823870315620118325246161815005707635314216,
    7697710448619093647773770563779383035563389093002172878136679058290219080485,
    11072840103210651889264953465496926731129187985494566222037544202431682505793,
    10600527402023018091029178773572770349547166823145304756736759597197473857814
    ];

    component indexBits = Num2Bits(nLevels);
    indexBits.in <== leafIndex;

    component hasher[nLevels];
    component lSwitcher[nLevels];
    component rSwitcher[nLevels];

    signal currentLevelHash[nLevels];

    hasher[0] = Poseidon(2);
    hasher[0].inputs[0] <== leaves[0];
    hasher[0].inputs[1] <== leaves[1];
    currentLevelHash[0] <== hasher[0].out;
    newSubtree[0] <== lastSubtree[0];

    for (var i = 1; i < nLevels; i++) {
        // Determine the left node at level i 
        lSwitcher[i] = Switcher();
        lSwitcher[i].L <== currentLevelHash[i - 1];
        lSwitcher[i].R <== lastSubtree[i];
        lSwitcher[i].sel <== indexBits.out[i];

        // Determine the right node at level i
        rSwitcher[i] = Switcher();
        rSwitcher[i].L <== ZEROES[i];
        rSwitcher[i].R <== currentLevelHash[i - 1];
        rSwitcher[i].sel <== indexBits.out[i];

        // Update the subtree at level i
        newSubtree[i] <== lSwitcher[i].outL;

        // Hash the left and right nodes at level i
        hasher[i] = Poseidon(2);
        hasher[i].inputs[0] <== lSwitcher[i].outL;
        hasher[i].inputs[1] <== rSwitcher[i].outL;
        currentLevelHash[i] <== hasher[i].out;
    }

    newRoot <== currentLevelHash[nLevels - 1];
}

