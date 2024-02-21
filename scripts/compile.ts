import { existsSync } from 'node:fs';
import shell from 'shelljs';
import config from './config';
import Compiler from '../src/compiler';

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

const getPTauFile = () => {
  const pTauFile = `${config.outDir}/ptau18`;
  if (!existsSync(pTauFile)) {
    console.log(`Downloading ptau file...`);
    shell.exec(`curl -L ${config.pTauUrl} --create-dirs -o ${pTauFile}`);
  }

  return pTauFile;
};

const main = async () => {
  shell.exec(`circom -V`);
  const circuitPath = getCircuitPath();
  const code = circuitPath.split('/')[2] as string;
  console.log(`Compiling circuit: ${code}\n`);

  const pTauPath = getPTauFile();
  const outDir = `${config.outDir}/${code}`;

  const compiler = new Compiler();
  compiler.compile({ src: circuitPath, outDir });

  const r1cs = `${outDir}/circuit.r1cs`;
  const outZKey = `${outDir}/keys.zkey`;
  compiler.generateKeys({ r1cs, pTauPath, out: outZKey });

  const outSol = `${outDir}/Verifier${code}.sol`;
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
