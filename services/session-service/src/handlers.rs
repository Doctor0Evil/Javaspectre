// services/session-service/src/handlers.rs
use crate::tokens::MintedToken;
use crate::config::Config;
use crate::ledger::LedgerHandle;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SessionRequest {
    pub vnode_profile: serde_json::Value,
    pub requested_abilities: Vec<String>,
    pub auth_assertion: String, // abstract WebAuthn/FIDO2 assertion
}

#[derive(Debug, Serialize)]
pub struct SessionResponse {
    pub session_ticket: serde_json::Value,
    pub access_token: MintedToken,
}

pub async fn create_session(
    cfg: &Config,
    ledger: &mut LedgerHandle,
    req: SessionRequest,
) -> Result<SessionResponse, String> {
    // 1. Validate auth_assertion externally (FIDO2/WebAuthn service)
    // 2. Check AU.ET/CSP in ledger
    // 3. If allowed, mint scoped token and SessionTicket JSON (using protocol schemas)

    // Placeholder token
    let token = MintedToken {
        token: "opaque-oauth-like-token".into(),
        expires_at: "2025-01-01T00:00:00Z".into(),
        scope: vec!["repo:read".into(), "repo:write".into()],
        vnode_id: "vnode-123".into(),
    };

    // Placeholder SessionTicket
    let ticket = serde_json::json!({
      "ticket_id": "ticket-abc",
      "vnode_id": "vnode-123",
      "issued_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-01-01T12:00:00Z",
      "auth_binding": {
        "method": "WebAuthn",
        "subject": "user@example.com"
      },
      "au_et_limit": 100.0,
      "csp_limit": 50.0,
      "abilities": req.requested_abilities,
      "mirrors": cfg.mirrors
    });

    Ok(SessionResponse {
        session_ticket: ticket,
        access_token: token,
    })
}
