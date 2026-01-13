import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import VirtualObjectExcavator from "../core/VirtualObjectExcavator.js";
import ExcavationSessionManager from "../core/ExcavationSessionManager.js";
import VirtualObjectScoreEngine from "../core/VirtualObjectScoreEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, "utf8");
  return JSON.parse(raw);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    // eslint-disable-next-line no-console
    console.error("Usage: node inspect.js <json-file>");
    process.exit(1);
  }

  const jsonFile = args[0];
  const data = readJson(jsonFile);

  const excavator = new VirtualObjectExcavator({
    maxDepth: 6,
    maxArraySample: 8,
    includeDom: false
  });
  const sessionManager = new ExcavationSessionManager({
    maxDepth: 6,
    maxSnapshots: 5
  });
  const scorer = new VirtualObjectScoreEngine({
    historyWindow: 10
  });

  const session = sessionManager.startSession(`json:${path.basename(jsonFile)}`, {
    source: jsonFile,
    type: "json-file"
  });

  const shallow = excavator.excavate({ value: data, domRoot: null });
  const snap1 = sessionManager.addSnapshot(session.id, shallow, "shallow");

  const deep = excavator.excavate({ value: data, domRoot: null });
  const snap2 = sessionManager.addSnapshot(session.id, deep, "deep");

  const scores = scorer.scoreSnapshot(snap2);

  const report = {
    session: sessionManager.getSessionSummary(session.id),
    scores
  };

  const outPath = path.join(process.cwd(), ".javaspectre-inspect-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  // eslint-disable-next-line no-console
  console.log(`Excavation report written to ${outPath}`);
}

main();
