// Path: cli/javaspectre-billing-check.js
// Assumes BillingGuardian.jar is built from BillingGuardian.java

import { spawnSync } from "node:child_process";

function runBillingGuardian() {
  const result = spawnSync("java", ["-jar", "BillingGuardian.jar"], {
    encoding: "utf8",
  });

  if (result.error) {
    console.error("Failed to run BillingGuardian.jar:", result.error);
    process.exit(1);
  }

  console.log(result.stdout);

  const riskLine = result.stdout.split("\n").find((l) =>
    l.startsWith("Risk level")
  );

  if (!riskLine) return;

  const level = riskLine.split(":")[1].trim();
  if (level === "HIGH" || level === "CRITICAL") {
    process.exitCode = 2; // nonzero for CI alerts
  }
}

runBillingGuardian();
