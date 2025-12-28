use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GithubOrgGuardrailOptions {
    pub codespaces_billing: BillingMode,
    pub branch_protection_template: Option<BranchProtectionTemplate>,
    pub enable_pages: bool,
    pub team_review_matrix: HashMap<String, Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BillingMode {
    OrgPaid,
    UserPaidOnly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BranchProtectionTemplate {
    pub require_multiple_reviewers: bool,
    pub enforce_code_owners: bool,
    pub require_status_checks: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GithubOrgGuardrailPlan {
    /// Human-intent for this guardrail application.
    pub intent: String,
    /// Ordered, normalized steps that an IDE/agent can execute.
    pub steps: Vec<String>,
    /// Flattened, effective configuration for the organization.
    pub effective_config: HashMap<String, serde_json::Value>,
    /// Deterministic SHA-256 hash over effective_config for auditing.
    pub config_hash: String,
}

/// Normalize guardrail options into a deterministic plan.
/// Invariant:
/// 1. steps.len() ≥ 5
/// 2. config_hash = SHA256(canonical_json(effective_config))
pub fn normalize_github_org_guardrail_options(
    options: GithubOrgGuardrailOptions,
) -> GithubOrgGuardrailPlan {
    let mut steps = vec!["normalizeGithubOrgGuardrailOptions".to_string()];

    // Billing mode handling
    match options.codespaces_billing {
        BillingMode::OrgPaid => {
            steps.push("configure_org_billing_and_spend_limit".to_string());
            steps.push("enable_org_codespaces_usage_telemetry".to_string());
        }
        BillingMode::UserPaidOnly => {
            steps.push("force_user_billing_only".to_string());
            steps.push("enforce_personal_spend_limits".to_string());
        }
    }

    // Branch protection template
    if let Some(template) = &options.branch_protection_template {
        steps.push("branch_protection_template".to_string());
        if template.require_multiple_reviewers {
            steps.push("apply_PR_approvals".to_string());
        }
        if template.enforce_code_owners {
            steps.push("apply_CODEOWNERS_enforcement".to_string());
        }
        if template.require_status_checks.as_ref().map(|v| !v.is_empty()).unwrap_or(false) {
            steps.push("apply_status_checks".to_string());
        }
    } else {
        steps.push("no_branch_protection_template_defined".to_string());
    }

    // GitHub Pages
    if options.enable_pages {
        steps.push("enable_github_pages".to_string());
        steps.push("enforce_pages_source_from_main_or_docs".to_string());
    } else {
        steps.push("skip_pages".to_string());
        steps.push("disable_org_level_pages_deployment".to_string());
    }

    // Team review matrix
    steps.push("define_team_based_review_matrix".to_string());
    steps.push("enforce_team_review_overrides_for_critical_repos".to_string());

    // Effective config assembled as canonical JSON object
    let effective_config_value = serde_json::json!({
        "billing_mode": format!("{:?}", options.codespaces_billing),
        "enable_pages": options.enable_pages,
        "team_review_matrix": options.team_review_matrix,
        "branch_protection": options.branch_protection_template
    });

    let effective_config_map: HashMap<String, serde_json::Value> =
        effective_config_value
            .as_object()
            .expect("effective_config must be an object")
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect();

    // Canonical JSON: stable key ordering via BTreeMap
    let mut ordered = serde_json::Map::new();
    let mut keys: Vec<_> = effective_config_map.keys().cloned().collect();
    keys.sort();
    for k in keys {
        if let Some(v) = effective_config_map.get(&k) {
            ordered.insert(k, v.clone());
        }
    }
    let canonical = serde_json::Value::Object(ordered);
    let canonical_str = serde_json::to_string(&canonical).expect("canonical json");

    // SHA-256 hash
    let mut hasher = Sha256::new();
    hasher.update(canonical_str.as_bytes());
    let hash_bytes = hasher.finalize();
    let config_hash = hex::encode(hash_bytes);

    GithubOrgGuardrailPlan {
        intent: "Apply comprehensive GitHub org guardrails".to_string(),
        steps,
        effective_config: effective_config_map,
        config_hash,
    }
}

/// Mathematical proof sketch: plan completeness and hash determinism.
///
/// Let O be the space of GithubOrgGuardrailOptions and P the space of
/// GithubOrgGuardrailPlan. Define normalize: O → P as implemented above.
/// 1. steps lower bound:
///    - Base step: "normalizeGithubOrgGuardrailOptions".
///    - Billing: always contributes 2 steps (either OrgPaid or UserPaidOnly).
///    - Branch protection: contributes ≥1 ("branch_protection_template" or
///      "no_branch_protection_template_defined") plus up to 3 more.
///    - Pages: contributes 2 steps ("enable_github_pages"+policy or
///      "skip_pages"+policy).
///    - Team matrix: contributes 2 steps.
///    So |steps| ≥ 1 + 2 + 1 + 2 + 2 = 8 for all O.
/// 2. Deterministic hash:
///    - effective_config is turned into a BTree-like ordering by sorting keys.
///    - canonical_str is unique for a given effective_config.
///    - SHA-256(canonical_str) is unique up to collision-resistance.
/// Therefore, for any fixed O, config_hash is deterministic and suitable as an
/// audit fingerprint for the configuration.
///
/// This directly aligns with CEM-grade deterministic hashing patterns for
/// auditability used in ALN runtimes.[file:10]
pub fn verify_plan_completeness(plan: &GithubOrgGuardrailPlan) -> bool {
    plan.steps.len() >= 8 && plan.intent == "Apply comprehensive GitHub org guardrails"
        && plan.config_hash.len() == 64
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::iter::FromIterator;

    #[test]
    fn test_complete_flow_all_branches_active() {
        let mut matrix = HashMap::new();
        matrix.insert(
            "core".to_string(),
            vec!["security-team".to_string(), "platform-team".to_string()],
        );
        matrix.insert(
            "infra".to_string(),
            vec!["infra-team".to_string()],
        );

        let options = GithubOrgGuardrailOptions {
            codespaces_billing: BillingMode::OrgPaid,
            branch_protection_template: Some(BranchProtectionTemplate {
                require_multiple_reviewers: true,
                enforce_code_owners: true,
                require_status_checks: Some(vec![
                    "ci/smoke".to_string(),
                    "ci/security-scan".to_string(),
                ]),
            }),
            enable_pages: true,
            team_review_matrix: matrix,
        };

        let plan = normalize_github_org_guardrail_options(options);
        assert!(verify_plan_completeness(&plan));
        // Steps:
        // 1 normalize
        // 2 org billing
        // 3 billing telemetry
        // 4 branch_protection_template
        // 5 apply_PR_approvals
        // 6 apply_CODEOWNERS_enforcement
        // 7 apply_status_checks
        // 8 enable_github_pages
        // 9 enforce_pages_source_from_main_or_docs
        // 10 define_team_based_review_matrix
        // 11 enforce_team_review_overrides_for_critical_repos
        assert_eq!(plan.steps.len(), 11);

        // Config hash should be stable for identical inputs.
        let mut matrix2 = HashMap::new();
        matrix2.insert(
            "core".to_string(),
            vec!["security-team".to_string(), "platform-team".to_string()],
        );
        matrix2.insert(
            "infra".to_string(),
            vec!["infra-team".to_string()],
        );

        let options2 = GithubOrgGuardrailOptions {
            codespaces_billing: BillingMode::OrgPaid,
            branch_protection_template: Some(BranchProtectionTemplate {
                require_multiple_reviewers: true,
                enforce_code_owners: true,
                require_status_checks: Some(vec![
                    "ci/smoke".to_string(),
                    "ci/security-scan".to_string(),
                ]),
            }),
            enable_pages: true,
            team_review_matrix: matrix2,
        };

        let plan2 = normalize_github_org_guardrail_options(options2);
        assert_eq!(plan.config_hash, plan2.config_hash);
    }

    #[test]
    fn test_minimal_flow_without_branch_protection() {
        let options = GithubOrgGuardrailOptions {
            codespaces_billing: BillingMode::UserPaidOnly,
            branch_protection_template: None,
            enable_pages: false,
            team_review_matrix: HashMap::from_iter(vec![(
                "sandbox".to_string(),
                vec!["dev-team".to_string()],
            )]),
        };

        let plan = normalize_github_org_guardrail_options(options);
        assert!(verify_plan_completeness(&plan));
        assert!(plan
            .steps
            .contains(&"no_branch_protection_template_defined".to_string()));
        assert!(plan
            .steps
            .contains(&"disable_org_level_pages_deployment".to_string()));
    }

    #[test]
    fn test_config_hash_length_and_hex_charset() {
        let options = GithubOrgGuardrailOptions {
            codespaces_billing: BillingMode::OrgPaid,
            branch_protection_template: None,
            enable_pages: false,
            team_review_matrix: HashMap::new(),
        };

        let plan = normalize_github_org_guardrail_options(options);
        assert_eq!(plan.config_hash.len(), 64);
        assert!(plan
            .config_hash
            .chars()
            .all(|c| c.is_ascii_hexdigit()));
    }
}

/// Validity hash: SHA256(complete implementation)
///
/// For a sanitized, reproducible stamp, compute:
/// `sha256sum src/github_org_guardrail.rs`
/// Example placeholder (replace with real value once in repo):
/// IMPLEMENTATION_HASH = "e9bf0b3f29f489326998f80a19e78c94b213ac80e52337f0dabe547416fd86ee"[file:10]
pub const IMPLEMENTATION_HASH: &str =
    "e9bf0b3f29f489326998f80a19e78c94b213ac80e52337f0dabe547416fd86ee";

#[no_mangle]
pub extern "C" fn github_org_guardrail_plan(
    options: *const std::os::raw::c_char,
) -> *const std::os::raw::c_char {
    use std::ffi::{CStr, CString};
    use std::os::raw::c_char;

    if options.is_null() {
        // Return an empty JSON object to avoid UB in FFI callers.
        let empty = CString::new("{\"error\":\"null_pointer\"}").unwrap();
        return empty.into_raw();
    }

    let c_str = unsafe { CStr::from_ptr(options) };
    let opts_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => {
            let err = CString::new("{\"error\":\"invalid_utf8\"}").unwrap();
            return err.into_raw();
        }
    };

    let opts: GithubOrgGuardrailOptions = match serde_json::from_str(opts_str) {
        Ok(o) => o,
        Err(_) => {
            let err = CString::new("{\"error\":\"invalid_options_json\"}").unwrap();
            return err.into_raw();
        }
    };

    let plan = normalize_github_org_guardrail_options(opts);
    let plan_json = match serde_json::to_string(&plan) {
        Ok(j) => j,
        Err(_) => {
            let err = CString::new("{\"error\":\"serialization_failure\"}").unwrap();
            return err.into_raw();
        }
    };

    CString::new(plan_json).unwrap().into_raw()
}
