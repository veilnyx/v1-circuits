import { existsSync, promises as fsPromises } from 'fs';
import shell from 'shelljs';

class Compiler {
  compile({ src, outDir }: { src: string; outDir: string }) {
    if (!existsSync(src)) {
      throw new Error(`File ${src} does not exist`);
    }

    const name = src.split('/').pop()?.split('.')[0] as string;

    // Create output directory, if not already exists
    shell.mkdir('-p', outDir);

    // Compile circuit
    const ss = shell.exec(`circom ${src} --r1cs --wasm --sym -o ${outDir}`, { silent: true });
    if (ss.stderr) {
      throw new Error(ss.stderr);
    }

    shell.mv(`${outDir}/${name}_js/*`, `${outDir}`);
    shell.rm('-rf', `${outDir}/${name}_js`);

    return new Circuit({ name, artifactsDir: outDir });
  }

  generateKeys({ r1cs, pTauPath, out }: { r1cs: string; pTauPath: string; out: string }) {
    const outDir = out.split('/').slice(0, -1).join('/');
    const name = out.split('/').pop()?.split('.')[0] as string;
    shell.exec(`snarkjs groth16 setup ${r1cs} ${pTauPath} ${outDir}/tmp_${name}.zkey`);
    shell.exec(
      `echo "test" | snarkjs zkey contribute ${outDir}/tmp_${name}.zkey ${outDir}/${name}.zkey`,
    );
  }

  ejectSolidityVerifier({ zKey, out }: { zKey: string; out: string }) {
    shell.exec(`snarkjs zkey export solidityverifier ${zKey} ${out}`);
  }
}

export class Circuit {
  artifactsDir: string;
  name: string;

  constructor({ name, artifactsDir }: { name: string; artifactsDir: string }) {
    this.artifactsDir = artifactsDir;
    this.name = name;
  }

  async calculateWitness(inputs: any) {
    const witnessCalculator = require(`${this.artifactsDir}/witness_calculator`);
    const wasm = await fsPromises.readFile(`${this.artifactsDir}/${this.name}.wasm`);
    const wc = await witnessCalculator(wasm);
    return wc.calculateWitness(inputs);
  }
}

export default Compiler;
