use regex::Regex;
use serde::Deserialize;
use std::env;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Deserialize)]
struct LintConfig {
    forbidden_terms: Vec<String>,
    ignore_paths: Vec<String>,
}

fn default_config() -> LintConfig {
    LintConfig {
        forbidden_terms: vec![
            "Cell".into(),
            "JavaSpectre".into(),
            "CyberCore".into(),
            "CEM".into(),
            "AU.ET".into(),
            "CSP".into(),
        ],
        ignore_paths: vec![
            ".git".into(),
            "target".into(),
            "node_modules".into(),
            ".github".into(),
        ],
    }
}

fn load_config(root: &Path) -> LintConfig {
    let cfg_path = root.join("pattern_lint.config.json");
    if cfg_path.exists() {
        match fs::read_to_string(&cfg_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| default_config()),
            Err(_) => default_config(),
        }
    } else {
        default_config()
    }
}

fn is_ignored(path: &Path, cfg: &LintConfig) -> bool {
    cfg.ignore_paths
        .iter()
        .any(|p| path.to_string_lossy().contains(p))
}

fn main() {
    let root = env::args().nth(1).unwrap_or_else(|| ".".into());
    let root_path = Path::new(&root);
    let cfg = load_config(root_path);

    let forbidden_regexes: Vec<Regex> = cfg
        .forbidden_terms
        .iter()
        .filter_map(|term| Regex::new(&format!(r"\b{}\b", regex::escape(term))).ok())
        .collect();

    let mut violations = Vec::new();

    for entry in WalkDir::new(root_path).into_iter().filter_map(Result::ok) {
        let path = entry.path();

        if path.is_dir() || is_ignored(path, &cfg) {
            continue;
        }

        // Only scan text-like files
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            let ext = ext.to_ascii_lowercase();
            if !["md", "rs", "json", "aln", "toml", "yml", "yaml", "txt"].contains(&ext.as_str()) {
                continue;
            }
        }

        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        for re in &forbidden_regexes {
            if re.is_match(&content) {
                violations.push(format!(
                    "Forbidden term '{}' in file: {}",
                    re.as_str(),
                    path.display()
                ));
            }
        }
    }

    if !violations.is_empty() {
        eprintln!("pattern_lint found violations:");
        for v in &violations {
            eprintln!("  - {}", v);
        }
        std::process::exit(1);
    } else {
        println!("pattern_lint: no forbidden terms found.");
    }
}
