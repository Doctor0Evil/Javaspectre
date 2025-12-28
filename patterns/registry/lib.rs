use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

/// Top-level registry structure mirroring `patterns/registry.json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternRegistry {
    pub version: String,
    #[serde(default)]
    pub schemaVersion: String,
    #[serde(default)]
    pub registry: String,
    pub patterns: Vec<Pattern>,
    #[serde(default)]
    pub metadata: RegistryMetadata,
}

/// Individual pattern entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pattern {
    pub id: String,
    pub title: String,
    pub category: String,
    pub path: String,
    #[serde(default)]
    pub specVersion: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub languages: Vec<String>,
    #[serde(default)]
    pub stability: String,
    #[serde(default)]
    pub maturity: String,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub entrypoint: String,
    #[serde(default)]
    pub replicationTime: String,
    #[serde(default)]
    pub hash: String,
}

/// High-level metadata and doctrine flags.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RegistryMetadata {
    #[serde(default)]
    pub totalPatterns: usize,
    #[serde(default)]
    pub categories: Vec<String>,
    #[serde(default)]
    pub stabilityBreakdown: StabilityBreakdown,
    #[serde(default)]
    pub created: String,
    #[serde(default)]
    pub javaspectreCompliant: bool,
    #[serde(default)]
    pub doctrineValidation: DoctrineValidation,
}

/// Per-stability counts.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct StabilityBreakdown {
    #[serde(default)]
    pub stable: usize,
    #[serde(default)]
    pub experimental: usize,
}

/// Validation of Javaspectre doctrines.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DoctrineValidation {
    #[serde(default)]
    pub codePurity: bool,
    #[serde(default)]
    pub completionIntegrity: bool,
    #[serde(default)]
    pub enrichmentLevel: String,
    #[serde(default)]
    pub replicationReady: bool,
}

/// Errors that can occur when working with the registry.
#[derive(Debug, thiserror::Error)]
pub enum RegistryError {
    #[error("Failed to read registry file at {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    #[error("Failed to parse JSON in {path}: {source}")]
    Json {
        path: PathBuf,
        #[source]
        source: serde_json::Error,
    },

    #[error("Registry validation failed: {0}")]
    Validation(String),
}

impl PatternRegistry {
    /// Load and validate a registry from the given path.
    ///
    /// This enforces:
    /// - Non-empty `id` and `path` for each pattern.
    /// - Unique `id` values.
    /// - All dependency IDs exist in the registry.
    pub fn load_from_path<P: AsRef<Path>>(path: P) -> Result<Self, RegistryError> {
        let path_ref = path.as_ref();
        let contents = fs::read_to_string(path_ref).map_err(|source| RegistryError::Io {
            path: path_ref.to_path_buf(),
            source,
        })?;

        let mut registry: PatternRegistry =
            serde_json::from_str(&contents).map_err(|source| RegistryError::Json {
                path: path_ref.to_path_buf(),
                source,
            })?;

        registry.backfill_metadata();
        registry.validate()?;
        Ok(registry)
    }

    /// Lightweight accessor to get a pattern by ID.
    pub fn get_pattern(&self, id: &str) -> Option<&Pattern> {
        self.patterns.iter().find(|p| p.id == id)
    }

    /// Ensure metadata fields are consistent with the patterns list
    /// even if they were omitted or out of date in the JSON file.
    fn backfill_metadata(&mut self) {
        self.metadata.totalPatterns = self.patterns.len();
        self.metadata.categories = {
            let mut cats: Vec<String> = self
                .patterns
                .iter()
                .map(|p| p.category.clone())
                .collect();
            cats.sort();
            cats.dedup();
            cats
        };

        let mut stable = 0usize;
        let mut experimental = 0usize;
        for p in &self.patterns {
            match p.stability.as_str() {
                "stable" => stable += 1,
                "experimental" => experimental += 1,
                _ => {}
            }
        }
        self.metadata.stabilityBreakdown.stable = stable;
        self.metadata.stabilityBreakdown.experimental = experimental;
    }

    /// Structural validation of the registry.
    fn validate(&self) -> Result<(), RegistryError> {
        if self.version.trim().is_empty() {
            return Err(RegistryError::Validation(
                "registry.version must not be empty".into(),
            ));
        }

        // Validate each pattern and enforce uniqueness.
        let mut seen_ids = std::collections::HashSet::new();
        for pattern in &self.patterns {
            if pattern.id.trim().is_empty() {
                return Err(RegistryError::Validation(
                    "pattern.id must not be empty".into(),
                ));
            }
            if pattern.path.trim().is_empty() {
                return Err(RegistryError::Validation(format!(
                    "pattern.path must not be empty for id '{}'",
                    pattern.id
                )));
            }

            if !seen_ids.insert(pattern.id.clone()) {
                return Err(RegistryError::Validation(format!(
                    "duplicate pattern id '{}'",
                    pattern.id
                )));
            }
        }

        // Dependency integrity.
        for pattern in &self.patterns {
            for dep in &pattern.dependencies {
                if !seen_ids.contains(dep) {
                    return Err(RegistryError::Validation(format!(
                        "pattern '{}' depends on unknown pattern id '{}'",
                        pattern.id, dep
                    )));
                }
            }
        }

        Ok(())
    }
}
