// Path: build/bundle/webpack.config.js

import path from "path";

export default {
  entry: path.resolve("src/cli/javaspectre.js"),
  mode: "production",
  output: {
    filename: "javaspectre.bundle.js",
    path: path.resolve("dist")
  },
  target: "node"
};
