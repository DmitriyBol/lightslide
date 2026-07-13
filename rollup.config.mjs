import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";

const external = ["react", "react-dom", "react/jsx-runtime"];

// Two entry points — the base carousel and the opt-in a11y layer — built with code splitting so
// the module they share (the a11y seam context) lands in ONE chunk imported by both. Bundling the
// entries separately would duplicate that context and break Provider ↔ consumer matching at
// runtime. Base consumers import only `dist/index.*`, which never pulls the a11y entry, so the
// layer stays out of their bundle.
const input = { index: "src/index.ts", a11y: "src/a11y/index.ts" };

export default [
  {
    input,
    external,
    output: [
      {
        dir: "dist",
        format: "cjs",
        entryFileNames: "[name].js",
        chunkFileNames: "shared/[name]-[hash].js",
        sourcemap: true,
        exports: "named",
      },
      {
        dir: "dist",
        format: "esm",
        entryFileNames: "[name].esm.js",
        chunkFileNames: "shared/[name]-[hash].esm.js",
        sourcemap: true,
      },
    ],
    plugins: [
      // SCSS modules → scoped class map, injected into <head> at runtime
      // so consumers need no separate CSS import.
      postcss({
        // Short scoped names ("_<hash>") instead of the default
        // "[name]-module_[local]__[hash]" — same uniqueness, far fewer bytes
        // shipped (each class is emitted in the CSS string and the JS class map).
        modules: { generateScopedName: "_[hash:base64:5]" },
        extensions: [".scss", ".css"],
        use: ["sass"],
        inject: true,
        minimize: true,
      }),
      // Per-file .d.ts emit is off here — the public type surface ships as the
      // bundled *.d.ts produced by rollup-plugin-dts below.
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationDir: undefined,
      }),
    ],
  },
  {
    input,
    // .scss carries no type surface (covered by styles.d.ts), so the
    // declaration bundle treats it as external instead of parsing it.
    external: (id) => external.includes(id) || /\.scss$/.test(id),
    output: {
      dir: "dist",
      format: "esm",
      entryFileNames: "[name].d.ts",
      chunkFileNames: "shared/[name]-[hash].d.ts",
    },
    plugins: [dts()],
  },
];
