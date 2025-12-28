# Pattern: Reconciliation

This pattern describes how to maintain consistency across multiple mirrors 
or replicas of a dataset or repository.

Key ideas:

- Each mirror exposes a minimal "head hash" endpoint.
- A deterministic rule selects the canonical head.
- Epoch hashes combine epoch number + head hash.
- A reconciliation CLI compares mirrors and emits a decision artifact.
