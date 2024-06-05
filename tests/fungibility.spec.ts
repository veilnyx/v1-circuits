import { expectEqFe, getCircuit } from './helpers';

describe('fungibility', function () {
  let circuitFungible;
  let circuitNonFungible;

  const t1 = 0x010001;
  const t2 = 0x010002;
  const t3 = 0x01ffff;
  const t4 = 0x020000;
  const t5 = 0x020001;
  const t6 = 0x030001;

  before(async function () {
    circuitFungible = await getCircuit('isFungible');
    circuitNonFungible = await getCircuit('isNonFungible');
  });

  it('should detect fungible assets correctly', async function () {
    const witness1 = await circuitFungible.calculateWitness({ assetId: t1 }, true);
    const witness2 = await circuitFungible.calculateWitness({ assetId: t2 }, true);
    const witness3 = await circuitFungible.calculateWitness({ assetId: t3 }, true);
    const witness4 = await circuitFungible.calculateWitness({ assetId: t4 }, true);
    const witness5 = await circuitFungible.calculateWitness({ assetId: t5 }, true);
    const witness6 = await circuitFungible.calculateWitness({ assetId: t6 }, true);

    expectEqFe(witness1[1], 1);
    expectEqFe(witness2[1], 1);
    expectEqFe(witness3[1], 1);
    expectEqFe(witness4[1], 0);
    expectEqFe(witness5[1], 0);
    expectEqFe(witness6[1], 0);
  });

  it('should detect non-fungible assets correctly', async function () {
    const witness1 = await circuitNonFungible.calculateWitness({ assetId: t1 }, true);
    const witness2 = await circuitNonFungible.calculateWitness({ assetId: t2 }, true);
    const witness3 = await circuitNonFungible.calculateWitness({ assetId: t3 }, true);
    const witness4 = await circuitNonFungible.calculateWitness({ assetId: t4 }, true);
    const witness5 = await circuitNonFungible.calculateWitness({ assetId: t5 }, true);
    const witness6 = await circuitNonFungible.calculateWitness({ assetId: t6 }, true);

    expectEqFe(witness1[1], 0);
    expectEqFe(witness2[1], 0);
    expectEqFe(witness3[1], 0);
    expectEqFe(witness4[1], 1);
    expectEqFe(witness5[1], 1);
    expectEqFe(witness6[1], 1);
  });
});
