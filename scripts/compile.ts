import { existsSync } from 'node:fs';
import shell from 'shelljs';
import config from './config';
import Compiler from '../src/compiler';

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const getCircuitPath = () => {
  let filename = process.argv[2];

  if (!filename) {
    throw new Error(`File not specified`);
  }

  if (!filename.endsWith('.circom')) {
    filename = `${filename}.circom`;
  }

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
  const pTauPath = getPTauFile();
  const name = circuitPath.split('/').pop()?.split('.')[0] as string;
  const outDir = `${config.outDir}/${name}`;

  const compiler = new Compiler();
  compiler.compile({ src: circuitPath, outDir });

  const r1cs = `${outDir}/${name}.r1cs`;
  const outZKey = `${outDir}/${name}.zkey`;
  compiler.generateKeys({ r1cs, pTauPath, out: outZKey });

  const outSol = `${outDir}/Verifier${capitalize(name)}.sol`;
  compiler.ejectSolidityVerifier({ zKey: outZKey, out: outSol });
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
