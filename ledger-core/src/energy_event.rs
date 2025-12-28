// ledger-core/src/energy_event.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EnergyEventReason {
    AbilityUse,
    AdminAdjust,
    MirrorUpdate,
    EpochSeal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnergyEvent {
    pub event_id: String,
    pub vnode_id: String,
    pub agent_id: String,
    pub au_et_delta: f64,
    pub csp_delta: f64,
    pub reason: EnergyEventReason,
    pub timestamp: String,
    pub prev_hash: String,
    pub hash: String,
}
