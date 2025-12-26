# ALN: Augmented Language Networks

ALN is the orchestration language of Javaspectre. It encodes **what** a system should do (intent), **where** it runs (environment), and **how** it should behave (constraints, artifacts) in a machine-auditable way.

## Core ALN document shape

Every ALN document follows the canonical schema defined in `blueprints/ALNSpec.blueprint.json`:

- `intent`  
  - `id`: Stable identifier derived from the text.  
  - `text`: Natural-language description (any human language).  
  - `locale`: BCP‑47 language tag.  
  - `goal`: High-level goal, e.g. `build_ci_workflow`, `deploy_xr_application`.  
  - `tags`: Lightweight keywords for routing and search.

- `domain`  
  - Target domain such as `xr_systems`, `interactive_gaming`, `ml_pipelines`, `sustainability`.

- `constraints`  
  - `maxLatencyMs`: Acceptable latency budget for end-to-end operations.  
  - `preferGreenRunners`: Whether to prefer energy-efficient runners.  
  - `securityLevel`: `standard` or `high`.  
  - `retries`, `timeoutSeconds`: Operational tolerances.  
  - `runtime`: Language/runtime hints (ALN standardizes on JavaScript for execution).

- `environment`  
  - `gitProvider`: e.g. `github`.  
  - `repoSlug`: `owner/repo`.  
  - `defaultBranch`: Typically `main`.  
  - `compatibleRunners`: CI or agent runners like `ubuntu-latest`, `xr-edge-sim`.  
  - `environmentVariables`: String-valued config map for engines.

- `artifacts`  
  - `workflowPlan`: Steps that can be turned into CI (e.g. GitHub Actions) via ALNWorkflowEmitter.  
  - `virtualObjects`: Structured representations of DOM, telemetry, or system state discovered by Javaspectre.  
  - `transparencyTrail`: Assumptions, risks, and tradeoffs for cognitive transparency.

ALN documents are produced by modules like `ALNUniversalIntentParser`, `SpectralEngine`, `ChromiumHarness`, and the DevTools extension, and can be consumed by agents, CI, and IDEs.
