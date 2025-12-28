// src/bin/javaspectre_vnodes.rs

use aln_vnodes::{build_vnode_graph, MachineObject};
use clap::Parser;
use std::fs;

#[derive(Parser, Debug)]
struct Cli {
    /// Path to MachineObjects JSON file (array of MachineObject)
    #[arg(long)]
    input: String,
    /// Origin tag, e.g. "JavaSpectre-0.1.0"
    #[arg(long, default_value = "JavaSpectre")]
    origin: String,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let data = fs::read_to_string(&cli.input)?;
    let objs: Vec<MachineObject> = serde_json::from_str(&data)?;
    let graph = build_vnode_graph(&cli.origin, &objs)?;

    println!("{}", serde_json::to_string_pretty(&graph)?);
    eprintln!("BLUEPRINT_HASH {}", graph.blueprint_hash);

    Ok(())
}
