// Path: aln-orchestrator/src/main.rs
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Deserialize)]
struct FragmentSpec {
    id: String,
    path: String,
    seal: String,
}

#[derive(Debug, Deserialize)]
struct PipelineNode {
    id: String,
    requires: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct OrchestrationSection {
    contracts: Vec<OrchestrationContract>,
    pipelines: OrchestrationPipelines,
}

#[derive(Debug, Deserialize)]
struct OrchestrationContract {
    id: String,
    repo: String,
    org: String,
}

#[derive(Debug, Deserialize)]
struct OrchestrationPipelines {
    graph: Vec<PipelineNode>,
}

#[derive(Debug, Deserialize)]
struct EnergySection {
    max_auet_per_day: u64,
    max_csp_per_day: u64,
}

#[derive(Debug, Deserialize)]
struct ComplianceSpec {
    version: String,
    language: String,
    blueprint: String,
    fragments: FragmentsWrapper,
    orchestration: OrchestrationSection,
    energy: EnergySection,
}

#[derive(Debug, Deserialize)]
struct FragmentsWrapper {
    items: Vec<FragmentSpec>,
}

#[derive(Debug, Serialize)]
struct FragmentResult {
    id: String,
    path: String,
    seal: String,
    status: String,
    expected: Option<String>,
    actual: Option<String>,
    detail: Option<String>,
}

#[derive(Debug, Serialize)]
struct ValidationReport {
    fragments: Vec<FragmentResult>,
    blueprint: String,
    version: String,
    energy_bounds: EnergySection,
}

#[derive(Debug, Error)]
enum OrchestratorError {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    #[error("TOML parse error: {0}")]
    Toml(#[from] toml::de::Error),
}

fn sha256_file(path: &Path) -> io::Result<String> {
    let mut file = fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 4096];
    loop {
        let n = file.read(&mut buf)?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

fn load_seal(path: &Path) -> io::Result<String> {
    let text = fs::read_to_string(path)?;
    if let Some(idx) = text.find('=') {
        Ok(text[idx + 1..].trim().to_string())
    } else {
        Ok(text.trim().to_string())
    }
}

fn load_spec(repo_root: &Path) -> Result<ComplianceSpec, OrchestratorError> {
    let spec_path = repo_root.join(".aln/compliance/COMPLIANCE_SPEC.aln");
    let text = fs::read_to_string(spec_path)?;
    let spec: ComplianceSpec = toml::from_str(&text)?;
    Ok(spec)
}

fn validate_fragments(repo_root: &Path) -> Result<(ValidationReport, bool), OrchestratorError> {
    let spec = load_spec(repo_root)?;
    let mut results = Vec::new();
    let mut ok = true;

    for frag in &spec.fragments.items {
        let fpath = repo_root.join(&frag.path);
        let spath = repo_root.join(&frag.seal);

        if !fpath.exists() {
            results.push(FragmentResult {
                id: frag.id.clone(),
                path: fpath.display().to_string(),
                seal: spath.display().to_string(),
                status: "missing_fragment".into(),
                expected: None,
                actual: None,
                detail: Some("fragment file not found".into()),
            });
            ok = false;
            continue;
        }

        if !spath.exists() {
            results.push(FragmentResult {
                id: frag.id.clone(),
                path: fpath.display().to_string(),
                seal: spath.display().to_string(),
                status: "missing_seal".into(),
                expected: None,
                actual: None,
                detail: Some("seal file not found".into()),
            });
            ok = false;
            continue;
        }

        let actual = sha256_file(&fpath)?;
        let expected = load_seal(&spath)?;

        if actual.to_lowercase() != expected.to_lowercase() {
            results.push(FragmentResult {
                id: frag.id.clone(),
                path: fpath.display().to_string(),
                seal: spath.display().to_string(),
                status: "hash_mismatch".into(),
                expected: Some(expected),
                actual: Some(actual),
                detail: None,
            });
            ok = false;
        } else {
            results.push(FragmentResult {
                id: frag.id.clone(),
                path: fpath.display().to_string(),
                seal: spath.display().to_string(),
                status: "ok".into(),
                expected: Some(expected),
                actual: Some(actual),
                detail: None,
            });
        }
    }

    let report = ValidationReport {
        fragments: results,
        blueprint: spec.blueprint,
        version: spec.version,
        energy_bounds: spec.energy,
    };

    let out_path = repo_root.join("compliance_report.json");
    fs::write(&out_path, serde_json::to_string_pretty(&report).unwrap())?;

    println!("ALN_ORCHESTRATOR_REPORT={}", out_path.display());
    Ok((report, ok))
}

fn main() -> Result<(), OrchestratorError> {
    let repo_root = std::env::var("GITHUB_WORKSPACE")
        .map(PathBuf::from)
        .unwrap_or_else(|_| std::env::current_dir().unwrap());

    let (report, ok) = validate_fragments(&repo_root)?;
    for frag in &report.fragments {
        println!("{} [{}]: {}", frag.path, frag.id, frag.status);
    }

    if !ok {
        std::process::exit(1);
    }
    Ok(())
}
