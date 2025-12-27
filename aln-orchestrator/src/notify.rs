// Path: aln-orchestrator/src/notify.rs
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
struct FragmentResult {
    id: String,
    path: String,
    status: String,
    detail: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ValidationReport {
    fragments: Vec<FragmentResult>,
    blueprint: String,
    version: String,
}

fn main() -> std::io::Result<()> {
    let repo_root = std::env::var("GITHUB_WORKSPACE")
        .map(PathBuf::from)
        .unwrap_or_else(|_| std::env::current_dir().unwrap());
    let report_path = repo_root.join("compliance_report.json");
    if !report_path.exists() {
        println!("No compliance_report.json; nothing to notify.");
        return Ok(());
    }
    let text = fs::read_to_string(&report_path)?;
    let report: ValidationReport = serde_json::from_str(&text)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;

    let mut violated = false;
    for frag in &report.fragments {
        if frag.status != "ok" {
            violated = true;
            let detail = frag.detail.as_deref().unwrap_or("");
            println!(
                "::error title=ALN compliance violation,file={}::id={} status={} detail={}",
                frag.path, frag.id, frag.status, detail
            );
        }
    }

    if violated {
        println!(
            "ALN_ORCHESTRATION: blueprint={} version={} status=violated",
            report.blueprint, report.version
        );
    } else {
        println!(
            "ALN_ORCHESTRATION: blueprint={} version={} status=clean",
            report.blueprint, report.version
        );
    }

    Ok(())
}
