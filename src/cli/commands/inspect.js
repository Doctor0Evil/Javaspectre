// Path: src/cli/commands/inspect.js

import fs from "fs";
import path from "path";
import { LiveVirtualHarvester } from "../../capabilities/LiveVirtualHarvester.js";
import { DOMSheetMapper } from "../../capabilities/DOMSheetMapper.js";
import { PhantomDetector } from "../../capabilities/PhantomDetector.js";

export async function runInspect(args, engine) {
  const target = args[0];
  if (!target) {
    throw new Error("javaspectre inspect requires a target file path.");
  }

  const full = path.resolve(target);
  if (!fs.existsSync(full)) {
    throw new Error(`Inspect target does not exist: ${full}`);
  }

  const content = fs.readFileSync(full, "utf8");

  let html = null;
  let json = null;

  try {
    json = JSON.parse(content);
  } catch {
    html = content;
  }

  const harvester = new LiveVirtualHarvester();
  const harvest = harvester.harvest({ html, json });

  const domSheetMapper = new DOMSheetMapper();
  const domSheet = html ? domSheetMapper.buildDomSheet({ html }) : null;

  const phantomDetector = new PhantomDetector();
  const phantomResult = phantomDetector.analyze({
    traces: [],
    networkLogs: []
  });

  const intent = `inspect ${full}`;
  const result = await engine.run(intent, {});

  process.stdout.write(
    JSON.stringify(
      {
        action: "inspect",
        target: full,
        harvest,
        domSheet,
        phantomResult,
        engineRunId: result.runId
      },
      null,
      2
    ) + "\n"
  );
}
