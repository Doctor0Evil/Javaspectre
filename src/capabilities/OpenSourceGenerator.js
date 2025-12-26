// Path: src/capabilities/OpenSourceGenerator.js
// Auto-generation of docs, licenses, and community templates.

import fs from "fs";
import path from "path";

export class OpenSourceGenerator {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || process.cwd();
  }

  /**
   * Generate OSS readiness files in the repository.
   *
   * @param {object} params
   * @param {string} params.projectName
   * @returns {object}
   */
  generate(params = {}) {
    const { projectName } = params;
    if (!projectName) {
      throw new Error("OpenSourceGenerator.generate: projectName is required.");
    }

    const root = this.repoRoot;
    this.#writeText(path.join(root, "LICENSE"), this.#mitLicense(projectName));
    this.#writeText(
      path.join(root, "CONTRIBUTING.md"),
      this.#contributing(projectName)
    );
    this.#writeText(
      path.join(root, "CODE_OF_CONDUCT.md"),
      this.#codeOfConduct(projectName)
    );

    const githubDir = path.join(root, ".github");
    this.#ensureDir(githubDir);
    this.#writeText(
      path.join(githubDir, "FUNDING.yml"),
      this.#fundingTemplate()
    );

    return {
      root,
      files: [
        "LICENSE",
        "CONTRIBUTING.md",
        "CODE_OF_CONDUCT.md",
        ".github/FUNDING.yml"
      ]
    };
  }

  #mitLicense(projectName) {
    const year = new Date().getFullYear();
    return [
      "MIT License",
      "",
      `Copyright (c) ${year} ${projectName}`,
      "",
      "Permission is hereby granted, free of charge, to any person obtaining a copy",
      "of this software and associated documentation files (the \"Software\"), to deal",
      "in the Software without restriction, including without limitation the rights",
      "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell",
      "copies of the Software, and to permit persons to whom the Software is",
      "furnished to do so, subject to the following conditions:",
      "",
      "The above copyright notice and this permission notice shall be included in",
      "all copies or substantial portions of the Software.",
      "",
      "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR",
      "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,",
      "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE",
      "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER",
      "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,",
      "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN",
      "THE SOFTWARE."
    ].join("\n");
  }

  #contributing(projectName) {
    return [
      `# Contributing to ${projectName}`,
      "",
      "Thank you for considering a contribution.",
      "",
      "## Guidelines",
      "",
      "- Use modern JavaScript (ES modules).",
      "- Ensure tests pass with `npm test` before submitting.",
      "- Keep changes focused and well documented.",
      "",
      "By contributing, you agree to follow the project's Code of Conduct."
    ].join("\n");
  }

  #codeOfConduct(projectName) {
    return [
      `# Code of Conduct for ${projectName}`,
      "",
      "All participants are expected to foster an open, welcoming, and harassment-free environment.",
      "",
      "Unacceptable behavior includes harassment, personal attacks, and sustained disruption.",
      "",
      "Issues can be reported via the repository's issue tracker or maintainers' contact details."
    ].join("\n");
  }

  #fundingTemplate() {
    return [
      "github: []",
      "patreon: []",
      "open_collective: []",
      "ko_fi: []",
      "custom: []"
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

export default OpenSourceGenerator;
