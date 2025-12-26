// Path: src/capabilities/CrossPlatformBuilder.js
// Multi-target Docker/CLI/serverless generator.

import fs from "fs";
import path from "path";

export class CrossPlatformBuilder {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || process.cwd();
  }

  /**
   * Generate cross-platform deployment artifacts for a simple Node service.
   *
   * @param {object} params
   * @param {string} params.entry
   * @returns {object}
   */
  generateArtifacts(params = {}) {
    const { entry } = params;
    if (!entry) {
      throw new Error("CrossPlatformBuilder.generateArtifacts: entry is required.");
    }

    const dockerDir = path.join(this.repoRoot, "build", "docker");
    const bundleDir = path.join(this.repoRoot, "build", "bundle");
    this.#ensureDir(dockerDir);
    this.#ensureDir(bundleDir);

    this.#writeText(
      path.join(dockerDir, "Dockerfile"),
      this.#dockerfile(entry)
    );
    this.#writeText(
      path.join(dockerDir, "entrypoint.sh"),
      this.#entrypointScript(entry)
    );
    this.#writeText(
      path.join(bundleDir, "webpack.config.js"),
      this.#webpackConfig(entry)
    );
    this.#writeText(
      path.join(bundleDir, "rollup.config.js"),
      this.#rollupConfig(entry)
    );

    return {
      dockerDir,
      bundleDir
    };
  }

  #dockerfile(entry) {
    return [
      "FROM node:20-alpine",
      "WORKDIR /app",
      "COPY package*.json ./",
      "RUN npm install --only=production",
      "COPY . .",
      `CMD [\"node\", \"${entry}\"]`
    ].join("\n");
  }

  #entrypointScript(entry) {
    return [
      "#!/bin/sh",
      "set -e",
      "echo \"Starting Javaspectre-generated service...\"",
      `node ${entry}`
    ].join("\n");
  }

  #webpackConfig(entry) {
    return [
      "import path from \"path\";",
      "",
      "export default {",
      `  entry: path.resolve("${entry}"),`,
      "  mode: \"production\",",
      "  output: {",
      "    filename: \"bundle.js\",",
      "    path: path.resolve(\"dist\"),",
      "  },",
      "  target: \"node\",",
      "};"
    ].join("\n");
  }

  #rollupConfig(entry) {
    return [
      "import { nodeResolve } from \"@rollup/plugin-node-resolve\";",
      "import commonjs from \"@rollup/plugin-commonjs\";",
      "",
      "export default {",
      `  input: \"${entry}\",`,
      "  output: {",
      "    file: \"dist/bundle.mjs\",",
      "    format: \"esm\",",
      "  },",
      "  plugins: [nodeResolve(), commonjs()],",
      "};"
    ].join("\n");
  }

  #ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  #writeText(filePath, text) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, text, "utf8");
  }
}

export default CrossPlatformBuilder;
