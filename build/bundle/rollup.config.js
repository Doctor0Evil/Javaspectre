// Path: build/bundle/rollup.config.js

import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/cli/javaspectre.js",
  output: {
    file: "dist/javaspectre.bundle.mjs",
    format: "esm"
  },
  plugins: [nodeResolve(), commonjs()]
};
