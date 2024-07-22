import { existsSync } from 'node:fs';
import shell from 'shelljs';
import config from './config';
import Compiler from '../src/compiler';
// @ts-ignore
import { readR1cs } from 'r1csfile';

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const getCircuitPath = () => {
  const id = process.argv[2] as string;
  if (!id) {
    throw new Error(`Circuit id not specified`);
  }

  let filename = `main/${id}/circuit.circom`;

  const filePath = `${config.srcDir}/${filename}`;

  if (!existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }

  return filePath;
};

const getCircuitInfo = async ({ r1cs }: { r1cs: string }) => {
  const info = await readR1cs(r1cs);

  return {
    nVars: Number(info.nVars),
    nConstraints: Number(info.nConstraints),
    nPrvInputs: Number(info.nPrvInputs),
    nPubInputs: Number(info.nPubInputs),
    nLabels: Number(info.nLabels),
    nOutputs: Number(info.nOutputs),
  };
};

const getPTauFile = (nVars: number) => {
  let power: number = 0;
  for (let i = 8; i <= 28; i++) {
    if (2 ** i > nVars) {
      power = i;
      break;
    }
  }

  if (!power) {
    throw new Error('No appropriate pTau file found');
  }

  const pTauFile = `${config.outDir}/ptau${power}`;
  if (!existsSync(pTauFile)) {
    console.log(`Downloading ptau file...`);
    //@ts-ignore
    shell.exec(`curl -L ${config.pTauUrls[power as any]} --create-dirs -o ${pTauFile}`);
  }

  return pTauFile;
};

const main = async () => {
  shell.exec(`circom -V`);
  const circuitPath = getCircuitPath();
  const circuitName = circuitPath.split('/')[2] as string;
  console.log(`Compiling circuit: ${circuitName}\n`);

  const outDir = `${config.outDir}/${circuitName}`;
  const compiler = new Compiler();
  await compiler.compile({ src: circuitPath, outDir });

  const circuitInfo = await getCircuitInfo({ r1cs: `${outDir}/circuit.r1cs` });
  console.log('Circuit Info:');
  console.table(circuitInfo);
  console.log('\n');

  const r1cs = `${outDir}/circuit.r1cs`;
  const outZKey = `${outDir}/keys.zkey`;
  const { nVars } = await getCircuitInfo({ r1cs });
  const pTauPath = getPTauFile(nVars);

  await compiler.generateKeys({ r1cs, pTauPath, out: outZKey });
  const outSol = `${outDir}/Verifier${capitalize(circuitName)}.sol`;
  await compiler.ejectSolidityVerifier({ zKey: outZKey, out: outSol });
};

main()
  .then(() => {
    console.log(`Compilation successful!`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
