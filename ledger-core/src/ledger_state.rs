// ledger-core/src/ledger_state.rs
use crate::energy_event::{EnergyEvent, EnergyEventReason};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnergyBalance {
    pub au_et: f64,
    pub csp: f64,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct LedgerState {
    pub balances: HashMap<String, EnergyBalance>, // agent_id -> balance
    pub events: Vec<EnergyEvent>,
    pub global_au_cap: f64,
    pub global_csp_cap: f64,
}

impl LedgerState {
    pub fn new(global_au_cap: f64, global_csp_cap: f64) -> Self {
        Self {
            balances: HashMap::new(),
            events: Vec::new(),
            global_au_cap,
            global_csp_cap,
        }
    }

    fn compute_hash(prev_hash: &str, payload: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(prev_hash.as_bytes());
        hasher.update(payload.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub fn apply_event(&mut self, mut ev: EnergyEvent) -> Result<(), String> {
        let prev_hash = self.events.last().map(|e| e.hash.clone()).unwrap_or_default();
        let payload = serde_json::to_string(&ev).map_err(|e| e.to_string())?;
        let hash = Self::compute_hash(&prev_hash, &payload);

        ev.prev_hash = prev_hash;
        ev.hash = hash;

        let balance = self.balances.entry(ev.agent_id.clone()).or_insert(EnergyBalance {
            au_et: 0.0,
            csp: 0.0,
        });

        let new_au = balance.au_et + ev.au_et_delta;
        let new_csp = balance.csp + ev.csp_delta;

        if new_au < 0.0 || new_csp < 0.0 {
            return Err("Nonnegativity violation".into());
        }

        if new_au > self.global_au_cap || new_csp > self.global_csp_cap {
            return Err("Global cap exceeded".into());
        }

        balance.au_et = new_au;
        balance.csp = new_csp;
        self.events.push(ev);

        Ok(())
    }
}
