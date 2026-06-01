import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const external = ["react", "react-dom", "react/jsx-runtime"];

export default [
  {
    input: "src/index.ts",
    external,
    output: [
      { file: "dist/index.js", format: "cjs", sourcemap: true },
      { file: "dist/index.esm.js", format: "esm", sourcemap: true },
    ],
    plugins: [typescript({ tsconfig: "./tsconfig.json" })],
  },
  {
    input: "src/index.ts",
    external,
    output: { file: "dist/index.d.ts", format: "esm" },
    plugins: [dts()],
  },
];
