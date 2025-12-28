# Pattern: Event Log

A minimal append-only event log pattern.

Properties:

- Events are immutable
- Each event references the previous hash
- A global epoch hash can seal a period
- Consumers replay events to reconstruct state
