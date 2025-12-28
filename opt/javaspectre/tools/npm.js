// /opt/javaspectre/tools/npm.js
// Javaspectre NPM bootstrap helper
// Generates a package.json wired to the javaspectre CLI and core modules.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPackageJson() {
  const pkg = {
    name: "javaspectre",
    version: "0.1.0",
    description: "Javaspectre – spectral AI virtual-object harvester and cybernetic toolkit.",
    type: "module",
    main: "src/index.js",
    bin: {
      javaspectre: "bin/javaspectre-cli.js"
    },
    scripts: {
      start: "node bin/javaspectre-cli.js --repl",
      cli: "node bin/javaspectre-cli.js",
      test: "echo \"No tests specified\" && exit 0"
    },
    keywords: [
      "ai",
      "spectral",
      "javaspectre",
      "neuromorphic",
      "cybernetics",
      "cli"
    ],
    author: "Dr. Jacob Scott Farmer",
    license: "MIT",
    engines: {
      node: ">=20.0.0"
    },
    dependencies: {},
    devDependencies: {}
  };

  const targetPath = path.join(__dirname, "..", "package.json");
  if (fs.existsSync(targetPath)) {
    console.error("package.json already exists at", targetPath);
    process.exit(1);
  }

  fs.writeFileSync(targetPath, JSON.stringify(pkg, null, 2), "utf8");
  console.log("Created package.json at", targetPath);
}

createPackageJson();
