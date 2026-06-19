import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";

const external = ["react", "react-dom", "react/jsx-runtime"];

export default [
  {
    input: "src/index.ts",
    external,
    output: [
      { file: "dist/index.js", format: "cjs", sourcemap: true },
      { file: "dist/index.esm.js", format: "esm", sourcemap: true },
    ],
    plugins: [
      // SCSS modules → scoped class map, injected into <head> at runtime
      // so consumers need no separate CSS import.
      postcss({
        modules: true,
        extensions: [".scss", ".css"],
        use: ["sass"],
        inject: true,
        minimize: true,
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
    ],
  },
  {
    input: "src/index.ts",
    // .scss carries no type surface (covered by styles.d.ts), so the
    // declaration bundle treats it as external instead of parsing it.
    external: (id) => external.includes(id) || /\.scss$/.test(id),
    output: { file: "dist/index.d.ts", format: "esm" },
    plugins: [dts()],
  },
];
