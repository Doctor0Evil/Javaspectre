// Path: examples/demo-aln-sync.js

import ALNEngine from "../src/core/ALNEngine.js";
import ALNRepoSynchronizer from "../src/core/ALNRepoSynchronizer.js";

const engine = new ALNEngine();
const { planId, steps, transparencyTrail } = engine.plan(
  "Create an ALN-ready repository for theme token mapping"
);

const alnSpecGraph = {
  module: "ThemeTokenMapper",
  structs: [{ name: "ThemeTokenReport" }],
  functions: [{ name: "mapTheme", params: ["memoizedState"], returnType: "ThemeTokenReport" }],
  constants: []
};

const blueprint = engine.generateRepoBlueprint(transparencyTrail.intent, alnSpecGraph);

const sync = new ALNRepoSynchronizer(process.cwd());
const report = sync.syncFromBlueprint(blueprint);

console.log("ALN plan:", planId);
console.log("Created files:", report.created);
console.log("Touched files:", report.touched);
console.log("Missing files:", report.missing);
