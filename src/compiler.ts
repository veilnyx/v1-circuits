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
    shell.exec(`snarkjs groth16 setup ${r1cs} ${pTauPath} ${outDir}/tmp_keys.zkey`);
    shell.exec(`echo "test" | snarkjs zkey contribute ${outDir}/tmp_keys.zkey ${outDir}/keys.zkey`);
    shell.exec(`snarkjs zkey export verificationkey ${outDir}/keys.zkey ${outDir}/vKey.json`);
  }

  async ejectSolidityVerifier({ zKey, out }: { zKey: string; out: string }) {
    shell.exec(`snarkjs zkey export solidityverifier ${zKey} ${out}`);

    const contractName = out.split('/').pop()?.split('.sol')[0] as string;
    const data = await fsPromises.readFile(out, 'utf8');

    const newData = data
      // Rename ejected contract
      .replace('Groth16Verifier', contractName)
      // Replace `gas()` with `not(0)` (to support EIP-4337 tx)
      .replace('sub(gas(), 2000)', `not(0)`)
      .replace('sub(gas(), 2000)', `not(0)`)
      .replace('sub(gas(), 2000)', `not(0)`);

    await fsPromises.writeFile(out, newData, 'utf8');
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
