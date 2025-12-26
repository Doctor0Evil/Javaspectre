# Contributing to Javaspectre

Javaspectre is a spectral-grade AI framework designed to convert conceptual uncertainty into executable JavaScript and high-impact, sustainability-aware systems. Contributions are welcome as long as they reinforce this mission and respect the Javaspectre Operational Doctrine.

## Contribution Principles

- **Code Purity**  
  - Only JavaScript is accepted for code contributions (ES modules, Node ≥18).  
  - No placeholders: avoid `TODO`, `TBD`, and incomplete stubs in committed code.

- **Completion & Integrity**  
  - Every new file must export a usable API and include at least one test case.  
  - Public functions and classes require minimal JSDoc or inline documentation.

- **Enrichment Mandate**  
  - When modifying existing code, leave it better structured, better documented, or better tested than before.  
  - Prefer refactors that reduce complexity, dead code, and duplication.

- **Spectral Impact**  
  - Favor designs that improve sustainability, efficiency, or safety metrics exposed via `SustainabilityCore` and `PlanetaryImpactSim`.

## How to Contribute

1. **Discuss first (recommended)**  
   - Open a GitHub issue proposing your change, referencing doctrine items where relevant.

2. **Fork and branch**
   ```
   git fork
   git checkout -b feature/my-spectral-capability
   ```

3. **Implement**
   - Place new core orchestrators under `src/core/`.  
   - Add new capabilities to `src/capabilities/` and register them in `JavaspectreCapabilities.js`.  
   - Use `src/utils/` for reusable helpers (selectors, schema emission, telemetry).

4. **Test**
   ```
   npm test
   ```
   - Add or extend tests under `tests/`:
     - `spectral.test.js` for core orchestration flows.  
     - `integrity.test.js` for integrity and anti-placeholder checks.  
     - `builder.test.js` for repo scaffolding and dependency graphs.  
     - `harvester.test.js` for DOM/API harvesting.

5. **Open a pull request**
   - Describe:
     - The problem you solved.  
     - The spectral capability or doctrine you advanced.  
     - Any sustainability or replication considerations (e.g., 24‑hour setup path).

## Code Style

- Use modern ES syntax (`import`/`export`) and avoid global state where possible.  
- Prefer pure functions and deterministic behavior, especially for `QuantumDependencyManager` and `PlanetaryImpactSim`.  
- Run `npm test` before submitting; CI must pass for merge.

## Security and Ethics

- Do not submit code intended for surveillance, harm, or exploitation.  
- Prefer features that:  
  - Reduce waste (compute, data, human attention).  
  - Increase transparency and auditability through `CognitiveTransparency`.

By contributing, you agree to follow the `CODE_OF_CONDUCT.md` and to license your contributions under the MIT License.
