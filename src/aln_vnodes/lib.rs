// src/aln_vnodes/lib.rs

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

/// Compression + decimal parameters (CEM-aligned).
const CE: f64 = 1e-12;      // AU.ET compression
const CS: f64 = 5e-13;      // CSP compression
const DALN: u32 = 9;        // internal decimals, e.g. 10^-9
const MAX_TOTAL_AUET: u128 = 1_000_000_000_000; // 1e12 in 10^-9 units
const MAX_TOTAL_CSP: u128  = 1_000_000_000;     // 1e9 in 10^-9 units

// ---- 1. Java MachineObject mirror (from MachineParser output JSON) ----

#[derive(Debug, Clone, Deserialize)]
pub struct MachineObject {
    pub id: String,
    pub path: String,
    pub r#type: String,
    pub attributes: BTreeMap<String, serde_json::Value>,
}

// ---- 2. RadEnvelopeQpu clone for safety (ICNIRP / IEEE-aligned) ----

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct RadEnvelopeQpu {
    pub dion: u64,
    pub srf_mwkg: u32,
    pub j_tissue_mam2: u32,
    pub dion_max: u64,
    pub srf_max_mwkg: u32,
    pub j_tissue_max_mam2: u32,
}

impl RadEnvelopeQpu {
    pub fn new(dion_max: u64, srf_max_mwkg: u32, j_tissue_max_mam2: u32) -> Self {
        Self {
            dion: 0,
            srf_mwkg: 0,
            j_tissue_mam2: 0,
            dion_max,
            srf_max_mwkg,
            j_tissue_max_mam2,
        }
    }

    /// Pure precheck: returns true iff adding (d, s, j) keeps all axes < caps.
    pub fn can_apply(&self, delta_dion: u64, delta_srf: u32, delta_j: u32) -> bool {
        let d_next = self.dion.saturating_add(delta_dion);
        if d_next > self.dion_max { return false; }
        let s_next = self.srf_mwkg.saturating_add(delta_srf);
        if s_next > self.srf_max_mwkg { return false; }
        let j_next = self.j_tissue_mam2.saturating_add(delta_j);
        if j_next > self.j_tissue_max_mam2 { return false; }
        true
    }

    /// Mutating update; valid only if `can_apply` was true.
    pub fn apply(&mut self, delta_dion: u64, delta_srf: u32, delta_j: u32) {
        let d_next = self.dion.saturating_add(delta_dion).min(self.dion_max);
        let s_next = self.srf_mwkg.saturating_add(delta_srf).min(self.srf_max_mwkg);
        let j_next = self.j_tissue_mam2.saturating_add(delta_j).min(self.j_tissue_max_mam2);
        self.dion = d_next;
        self.srf_mwkg = s_next;
        self.j_tissue_mam2 = j_next;
    }

    /// Composite safety score σ ∈ [0,1]; 1 = no load, 0 = one axis saturated.
    pub fn sigma(&self) -> f32 {
        let sd = if self.dion_max == 0 {
            0.0
        } else {
            let r = self.dion as f32 / self.dion_max as f32;
            (1.0 - r.clamp(0.0, 1.0)).max(0.0)
        };
        let ss = if self.srf_max_mwkg == 0 {
            0.0
        } else {
            let r = self.srf_mwkg as f32 / self.srf_max_mwkg as f32;
            (1.0 - r.clamp(0.0, 1.0)).max(0.0)
        };
        let sj = if self.j_tissue_max_mam2 == 0 {
            0.0
        } else {
            let r = self.j_tissue_mam2 as f32 / self.j_tissue_max_mam2 as f32;
            (1.0 - r.clamp(0.0, 1.0)).max(0.0)
        };
        (sd + ss + sj) / 3.0
    }
}

// ---- 3. Energy mapping (SourceState → AU.ET, CSP) ----

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct SourceState {
    pub origin: String,   // e.g. "JavaSpectre"
    pub object_id: String,
    pub weight: u128,     // minimal units, deterministic
}

#[derive(Debug, thiserror::Error)]
pub enum EnergyError {
    #[error("invalid compression factors")]
    InvalidCompression,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnergyBudget {
    pub auet: u128,
    pub csp: u128,
}

fn map_to_energy(state: &SourceState, ce: f64, cs: f64) -> Result<EnergyBudget, EnergyError> {
    if !(0.0..=1.0).contains(&ce) || !(0.0..=1.0).contains(&cs) {
        return Err(EnergyError::InvalidCompression);
    }
    let b = state.weight as f64;
    let factor_aln = 10f64.powi(DALN as i32);

    let ae = b * ce;
    let as_ = b * cs;

    let be = (ae * factor_aln).floor().max(0.0) as u128;
    let bs = (as_ * factor_aln).floor().max(0.0) as u128;

    Ok(EnergyBudget { auet: be, csp: bs })
}

// ---- 4. VNode definition and hashing ----

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VNodeKind {
    Service,
    Node,
    Task,
    VirtualObject,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VNode {
    pub vnode_id: String,
    pub path: String,
    pub kind: VNodeKind,
    pub attributes: BTreeMap<String, serde_json::Value>,
    pub energy: EnergyBudget,
    pub rad_envelope: RadEnvelopeQpu,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VNodeGraph {
    pub vnodes: Vec<VNode>,
    pub total_auet: u128,
    pub total_csp: u128,
    pub blueprint_hash: String,
}

/// Infer VNodeKind from MachineObject.type/path (sanitized).
fn infer_kind(obj: &MachineObject) -> VNodeKind {
    let t = obj.r#type.to_lowercase();
    if t.contains("service") {
        VNodeKind::Service
    } else if t.contains("node") {
        VNodeKind::Node
    } else if t.contains("task") {
        VNodeKind::Task
    } else {
        VNodeKind::VirtualObject
    }
}

/// Deterministic per-type safety caps (example, ICNIRP/IEEE-consistent ranges). [file:5]
fn default_rad_caps(kind: &VNodeKind) -> RadEnvelopeQpu {
    match kind {
        // Service/node assumed infra, lower SAR and J budgets.
        VNodeKind::Service | VNodeKind::Node => RadEnvelopeQpu::new(
            10_000_000, // nSv annual dose budget (0.01 Gy)
            2000,       // mW/kg, 2 W/kg
            10,         // mA/m^2
        ),
        // Task/virtual may be lower duty-cycle; same caps here, adjustable.
        VNodeKind::Task | VNodeKind::VirtualObject => RadEnvelopeQpu::new(
            10_000_000,
            2000,
            10,
        ),
    }
}

/// Build a VNodeGraph from MachineObjects and a deterministic weight function.
pub fn build_vnode_graph(
    origin: &str,
    objects: &[MachineObject],
) -> Result<VNodeGraph, EnergyError> {
    let mut vnodes = Vec::with_capacity(objects.len());
    let mut total_auet: u128 = 0;
    let mut total_csp: u128 = 0;

    for obj in objects {
        let kind = infer_kind(obj);

        // Weight function: deterministic, non-negative, based on path length.
        // You can swap this for any policy that produces u128 weights.
        let weight = (obj.path.len() as u128).max(1);

        let src = SourceState {
            origin: origin.to_string(),
            object_id: obj.id.clone(),
            weight,
        };
        let energy = map_to_energy(&src, CE, CS)?;

        total_auet = total_auet.saturating_add(energy.auet);
        total_csp = total_csp.saturating_add(energy.csp);

        let rad_envelope = default_rad_caps(&kind);

        vnodes.push(VNode {
            vnode_id: obj.id.clone(),
            path: obj.path.clone(),
            kind,
            attributes: obj.attributes.clone(),
            energy,
            rad_envelope,
        });
    }

    // Enforce global caps (non-minting scarcity). [file:5]
    assert!(total_auet <= MAX_TOTAL_AUET, "AU.ET cap exceeded");
    assert!(total_csp <= MAX_TOTAL_CSP, "CSP cap exceeded");

    // Deterministic blueprint hash over canonical JSON.
    let graph_tmp = serde_json::json!({
        "vnodes": &vnodes,
        "total_auet": total_auet.to_string(),
        "total_csp": total_csp.to_string(),
    });
    let blob = graph_tmp.to_string();
    let mut hasher = Sha256::new();
    hasher.update(blob.as_bytes());
    let blueprint_hash = format!("{:x}", hasher.finalize());

    Ok(VNodeGraph {
        vnodes,
        total_auet,
        total_csp,
        blueprint_hash,
    })
}
