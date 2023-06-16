import path from 'path';
import { wasm as wasmTester } from 'circom_tester';
//@ts-ignore
import { F1Field, Scalar } from 'ffjavascript';

export const fieldsSize =
  '21888242871839275222246405745257275088548364400416034343698204186575808495617';

// export const getCircuit = async (name: string) => {
//   const circuitPath = path.join(__dirname, 'mocks', name + '.circom');
//   const compiler = new Compiler();
//   const circuit = compiler.compile({
//     src: circuitPath,
//     outDir: path.join(__dirname, '..', '.tmp', name),
//   });

//   return circuit;
// };

export const getCircuit = async (name: string) => {
  const circuitPath = path.join(__dirname, '..', 'mocks', name + '.circom');
  const tmpDir = path.join(__dirname, '..', '..', '.tmp', name);
  const circuit = await wasmTester(circuitPath, { output: tmpDir });
  return circuit;
};

export const Fr = new F1Field(Scalar.fromString(fieldsSize));
