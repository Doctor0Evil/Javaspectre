// Path: tests/harvester.test.js

import { LiveVirtualHarvester } from "../src/capabilities/LiveVirtualHarvester.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed.");
  }
}

(() => {
  const html = `
    <html>
      <body>
        <div id="app" class="container main">
          <h1>Title</h1>
          <p>Content</p>
        </div>
      </body>
    </html>
  `;
  const harvester = new LiveVirtualHarvester();
  const result = harvester.harvest({ html });

  assert(result.catalog.domSelectors.length > 0, "Should discover selectors.");
  console.log("harvester.test.js OK");
})();
