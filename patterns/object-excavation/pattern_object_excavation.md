# Pattern: Object Excavation

This pattern describes how to walk a repository or dataset and classify 
objects based on structural and semantic signatures.

The excavator:

- Reads only (never writes)
- Builds a typed graph of discovered objects
- Emits a classification report
- Uses structural and semantic signatures to infer object types
