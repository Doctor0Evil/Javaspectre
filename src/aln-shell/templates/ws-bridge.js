// Path: src/aln-shell/templates/ws-bridge.js
// Minimal Node/WebSocket EEG/IoT bridge for ALN Web Kernel dashboards.

import http from "http";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";

const ROOT_DIR = process.env.ALN_SHELL_ROOT || process.cwd();
const PORT = Number(process.env.ALN_SHELL_PORT || 8080);
const WS_PATH = "/signals";

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/aln-augmented-user-kernel.html" : req.url;
  const filePath = path.join(ROOT_DIR, urlPath.replace(/^\//, ""));
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".html"
        ? "text/html; charset=utf-8"
        : ext === ".js"
        ? "application/javascript; charset=utf-8"
        : "text/plain; charset=utf-8";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer(serveStatic);
const wss = new WebSocketServer({ server, path: WS_PATH });

function broadcast(payload) {
  const json = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(json);
    }
  }
}

// Demo signal: synthetic EEG/IoT-like stream.
// In a real deployment, replace this with a bridge to OpenBCI, Muse, or IoT edge.
setInterval(() => {
  const now = Date.now();
  const payload = {
    ts: now,
    type: "aln-signal",
    source: "demo-synth",
    channels: [
      {
        id: "eeg_alpha",
        value: Math.random() * 50,
        unit: "µV"
      },
      {
        id: "eeg_beta",
        value: Math.random() * 40,
        unit: "µV"
      },
      {
        id: "energy_kwh",
        value: 0.5 + Math.random() * 0.2,
        unit: "kWh"
      }
    ]
  };
  broadcast(payload);
}, 500);

server.listen(PORT, () => {
  console.log(`[ALN Web Kernel] HTTP server listening on http://localhost:${PORT}`);
  console.log(`[ALN Web Kernel] WebSocket stream at ws://localhost:${PORT}${WS_PATH}`);
  console.log(
    "[ALN Web Kernel] Open aln-augmented-user-kernel.html in your browser to view the dashboard."
  );
});
