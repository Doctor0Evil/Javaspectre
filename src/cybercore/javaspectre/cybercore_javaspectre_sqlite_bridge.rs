use std::path::Path;
use std::sync::Arc;
use rusqlite::{params, Connection, OpenFlags, Row, NO_PARAMS};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use thiserror::Error;

/// Core error type for the Javaspectre SQLite bridge.
#[derive(Debug, Error)]
pub enum JavaspectreError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Hash error: {0}")]
    Hash(String),
    #[error("Invalid schema: {0}")]
    Schema(String),
}

/// Span representation in the Cybercore-Javaspectre bridge.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpanRecord {
    pub span_id: String,
    pub trace_id: String,
    pub parent_span_id: Option<String>,
    pub start_time_ns: i64,
    pub end_time_ns: i64,
    pub span_name: String,
    pub span_kind: Option<String>,
    pub status_code: Option<String>,
    pub service_name: Option<String>,
    pub http_method: Option<String>,
    pub http_route: Option<String>,
    pub correlation_id: Option<String>,
    pub attributes: Value,
    pub resource: Value,
    pub raw_span: Value,
}

/// DOM snapshot row.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomSnapshotRecord {
    pub snapshot_id: String,
    pub trace_id: Option<String>,
    pub correlation_id: Option<String>,
    pub captured_at_ns: i64,
    pub raw_dom: Value,
}

/// DOM sheet row (stabilized DOM grid).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomSheetRecord {
    pub sheet_id: String,
    pub snapshot_id: String,
    pub trace_id: Option<String>,
    pub correlation_id: Option<String>,
    pub dom_stability_score: Option<f64>,
    pub dom_tree: Value,
    pub noise_stats: Option<Value>,
}

/// HAR entry row.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HarEntryRecord {
    pub entry_id: String,
    pub correlation_id: Option<String>,
    pub started_at_ns: Option<i64>,
    pub method: Option<String>,
    pub url: Option<String>,
    pub status: Option<i64>,
    pub request_json: Option<Value>,
    pub response_json: Option<Value>,
    pub raw_entry: Value,
}

/// Inferred JSON schema row.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonSchemaRecord {
    pub schema_id: String,
    pub endpoint_key: String,
    pub version: i64,
    pub inferred_at_ns: i64,
    pub confidence: f64,
    pub schema_json: Value,
}

/// Content-addressed snapshot row.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotV1Record {
    pub snapshot_hash: String,
    pub created_at_ns: i64,
    pub kind: String,
    pub payload: Value,
}

/// Bridge-level configuration.
#[derive(Debug, Clone)]
pub struct JavaspectreConfig {
    pub path: String,
    pub read_only: bool,
    pub foreign_keys: bool,
    pub wal_mode: bool,
}

impl Default for JavaspectreConfig {
    fn default() -> Self {
        Self {
            path: "javaspectre.db".to_string(),
            read_only: false,
            foreign_keys: true,
            wal_mode: true,
        }
    }
}

/// Main handle into the cybernetic storage core for Javaspectre.
#[derive(Clone)]
pub struct JavaspectreStore {
    conn: Arc<Connection>,
}

impl JavaspectreStore {
    pub fn open(config: JavaspectreConfig) -> Result<Self, JavaspectreError> {
        let flags = if config.read_only {
            OpenFlags::SQLITE_OPEN_READ_ONLY
        } else {
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE
        };

        let path = Path::new(&config.path);
        let conn = Connection::open_with_flags(path, flags)?;

        if config.foreign_keys {
            conn.pragma_update(None, "foreign_keys", &"ON")?;
        }
        if config.wal_mode {
            conn.pragma_update(None, "journal_mode", &"WAL")?;
        }

        let store = Self {
            conn: Arc::new(conn),
        };

        store.init_schema()?;
        Ok(store)
    }

    fn init_schema(&self) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;

        // Spans
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS spans (
              span_id        TEXT PRIMARY KEY,
              trace_id       TEXT NOT NULL,
              parent_span_id TEXT,
              start_time_ns  INTEGER NOT NULL,
              end_time_ns    INTEGER NOT NULL,
              span_name      TEXT NOT NULL,
              span_kind      TEXT,
              status_code    TEXT,
              service_name   TEXT,
              http_method    TEXT,
              http_route     TEXT,
              correlation_id TEXT,
              attributes     TEXT NOT NULL,
              resource       TEXT NOT NULL,
              raw_span       TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_spans_trace_id
              ON spans(trace_id);

            CREATE INDEX IF NOT EXISTS idx_spans_http_route
              ON spans(http_route);

            CREATE INDEX IF NOT EXISTS idx_spans_status_code
              ON spans(status_code);

            CREATE INDEX IF NOT EXISTS idx_spans_service_name
              ON spans(service_name);

            CREATE INDEX IF NOT EXISTS idx_spans_correlation
              ON spans(correlation_id);

            CREATE INDEX IF NOT EXISTS idx_spans_attr_status_code
              ON spans(json_extract(attributes, '$.http.status_code'));
            "#,
        )?;

        // DOM snapshots
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS dom_snapshots (
              snapshot_id    TEXT PRIMARY KEY,
              trace_id       TEXT,
              correlation_id TEXT,
              captured_at_ns INTEGER NOT NULL,
              raw_dom        TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_dom_snapshots_trace
              ON dom_snapshots(trace_id);

            CREATE INDEX IF NOT EXISTS idx_dom_snapshots_corr
              ON dom_snapshots(correlation_id);
            "#,
        )?;

        // DOM sheets
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS dom_sheets (
              sheet_id       TEXT PRIMARY KEY,
              snapshot_id    TEXT NOT NULL,
              trace_id       TEXT,
              correlation_id TEXT,
              dom_stability_score REAL,
              dom_tree       TEXT NOT NULL,
              noise_stats    TEXT,
              FOREIGN KEY (snapshot_id) REFERENCES dom_snapshots(snapshot_id)
                ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_dom_sheets_corr
              ON dom_sheets(correlation_id);

            CREATE INDEX IF NOT EXISTS idx_dom_sheets_snapshot
              ON dom_sheets(snapshot_id);

            CREATE INDEX IF NOT EXISTS idx_dom_sheets_role_button
              ON dom_sheets(json_extract(dom_tree, '$.roles.button_count'));
            "#,
        )?;

        // HAR entries
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS har_entries (
              entry_id       TEXT PRIMARY KEY,
              correlation_id TEXT,
              started_at_ns  INTEGER,
              method         TEXT,
              url            TEXT,
              status         INTEGER,
              request_json   TEXT,
              response_json  TEXT,
              raw_entry      TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_har_entries_corr
              ON har_entries(correlation_id);

            CREATE INDEX IF NOT EXISTS idx_har_entries_url
              ON har_entries(url);

            CREATE INDEX IF NOT EXISTS idx_har_entries_method
              ON har_entries(method);

            CREATE INDEX IF NOT EXISTS idx_har_entries_status
              ON har_entries(status);
            "#,
        )?;

        // JSON schemas
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS json_schemas (
              schema_id      TEXT PRIMARY KEY,
              endpoint_key   TEXT NOT NULL,
              version        INTEGER NOT NULL,
              inferred_at_ns INTEGER NOT NULL,
              confidence     REAL NOT NULL,
              schema_json    TEXT NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_json_schemas_endpoint_version
              ON json_schemas(endpoint_key, version);

            CREATE INDEX IF NOT EXISTS idx_json_schemas_confidence
              ON json_schemas(confidence);
            "#,
        )?;

        // Snapshots v1 (content-addressed)
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS snapshots_v1 (
              snapshot_hash  TEXT PRIMARY KEY,
              created_at_ns  INTEGER NOT NULL,
              kind           TEXT NOT NULL,
              payload        TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_snapshots_v1_kind
              ON snapshots_v1(kind);

            CREATE INDEX IF NOT EXISTS idx_snapshots_v1_created
              ON snapshots_v1(created_at_ns);
            "#,
        )?;

        Ok(())
    }

    /// Insert or upsert a span.
    pub fn upsert_span(&self, span: &SpanRecord) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;
        conn.execute(
            r#"
            INSERT INTO spans (
              span_id, trace_id, parent_span_id, start_time_ns, end_time_ns,
              span_name, span_kind, status_code, service_name,
              http_method, http_route, correlation_id,
              attributes, resource, raw_span
            ) VALUES (
              ?1, ?2, ?3, ?4, ?5,
              ?6, ?7, ?8, ?9,
              ?10, ?11, ?12,
              ?13, ?14, ?15
            )
            ON CONFLICT(span_id) DO UPDATE SET
              trace_id = excluded.trace_id,
              parent_span_id = excluded.parent_span_id,
              start_time_ns = excluded.start_time_ns,
              end_time_ns = excluded.end_time_ns,
              span_name = excluded.span_name,
              span_kind = excluded.span_kind,
              status_code = excluded.status_code,
              service_name = excluded.service_name,
              http_method = excluded.http_method,
              http_route = excluded.http_route,
              correlation_id = excluded.correlation_id,
              attributes = excluded.attributes,
              resource = excluded.resource,
              raw_span = excluded.raw_span
            "#,
            params![
                span.span_id,
                span.trace_id,
                span.parent_span_id,
                span.start_time_ns,
                span.end_time_ns,
                span.span_name,
                span.span_kind,
                span.status_code,
                span.service_name,
                span.http_method,
                span.http_route,
                span.correlation_id,
                span.attributes.to_string(),
                span.resource.to_string(),
                span.raw_span.to_string()
            ],
        )?;
        Ok(())
    }

    pub fn insert_dom_snapshot(&self, snap: &DomSnapshotRecord) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;
        conn.execute(
            r#"
            INSERT OR REPLACE INTO dom_snapshots (
              snapshot_id, trace_id, correlation_id, captured_at_ns, raw_dom
            ) VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            params![
                snap.snapshot_id,
                snap.trace_id,
                snap.correlation_id,
                snap.captured_at_ns,
                snap.raw_dom.to_string()
            ],
        )?;
        Ok(())
    }

    pub fn insert_dom_sheet(&self, sheet: &DomSheetRecord) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;
        conn.execute(
            r#"
            INSERT OR REPLACE INTO dom_sheets (
              sheet_id, snapshot_id, trace_id, correlation_id,
              dom_stability_score, dom_tree, noise_stats
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
            params![
                sheet.sheet_id,
                sheet.snapshot_id,
                sheet.trace_id,
                sheet.correlation_id,
                sheet.dom_stability_score,
                sheet.dom_tree.to_string(),
                sheet.noise_stats.as_ref().map(|v| v.to_string())
            ],
        )?;
        Ok(())
    }

    pub fn insert_har_entry(&self, entry: &HarEntryRecord) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;
        conn.execute(
            r#"
            INSERT OR REPLACE INTO har_entries (
              entry_id, correlation_id, started_at_ns, method,
              url, status, request_json, response_json, raw_entry
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                entry.entry_id,
                entry.correlation_id,
                entry.started_at_ns,
                entry.method,
                entry.url,
                entry.status,
                entry.request_json.as_ref().map(|v| v.to_string()),
                entry.response_json.as_ref().map(|v| v.to_string()),
                entry.raw_entry.to_string()
            ],
        )?;
        Ok(())
    }

    pub fn insert_json_schema(&self, schema: &JsonSchemaRecord) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;
        conn.execute(
            r#"
            INSERT OR REPLACE INTO json_schemas (
              schema_id, endpoint_key, version,
              inferred_at_ns, confidence, schema_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
            params![
                schema.schema_id,
                schema.endpoint_key,
                schema.version,
                schema.inferred_at_ns,
                schema.confidence,
                schema.schema_json.to_string()
            ],
        )?;
        Ok(())
    }

    pub fn insert_snapshot_v1(&self, snap: &SnapshotV1Record) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;
        conn.execute(
            r#"
            INSERT OR REPLACE INTO snapshots_v1 (
              snapshot_hash, created_at_ns, kind, payload
            ) VALUES (?1, ?2, ?3, ?4)
            "#,
            params![
                snap.snapshot_hash,
                snap.created_at_ns,
                snap.kind,
                snap.payload.to_string()
            ],
        )?;
        Ok(())
    }

    /// Example query: find slow spans with related DOM sheets.
    pub fn find_slow_spans_with_dom(
        &self,
        min_duration_ns: i64,
        limit: i64,
    ) -> Result<Vec<(SpanRecord, Vec<DomSheetRecord>)>, JavaspectreError> {
        let conn = &*self.conn;
        let mut stmt = conn.prepare(
            r#"
            SELECT
              span_id, trace_id, parent_span_id, start_time_ns, end_time_ns,
              span_name, span_kind, status_code, service_name,
              http_method, http_route, correlation_id,
              attributes, resource, raw_span
            FROM spans
            WHERE
              (end_time_ns - start_time_ns) >= ?1
            ORDER BY (end_time_ns - start_time_ns) DESC
            LIMIT ?2
            "#,
        )?;

        let spans_iter = stmt.query_map(params![min_duration_ns, limit], |row| {
            Self::row_to_span(row)
        })?;

        let mut results = Vec::new();
        for span_result in spans_iter {
            let span = span_result?;
            let dom_sheets = self.load_dom_sheets_for_correlation(span.correlation_id.clone())?;
            results.push((span, dom_sheets));
        }
        Ok(results)
    }

    fn row_to_span(row: &Row<'_>) -> Result<SpanRecord, rusqlite::Error> {
        Ok(SpanRecord {
            span_id: row.get(0)?,
            trace_id: row.get(1)?,
            parent_span_id: row.get(2)?,
            start_time_ns: row.get(3)?,
            end_time_ns: row.get(4)?,
            span_name: row.get(5)?,
            span_kind: row.get(6)?,
            status_code: row.get(7)?,
            service_name: row.get(8)?,
            http_method: row.get(9)?,
            http_route: row.get(10)?,
            correlation_id: row.get(11)?,
            attributes: serde_json::from_str::<Value>(&row.get::<_, String>(12)?)?,
            resource: serde_json::from_str::<Value>(&row.get::<_, String>(13)?)?,
            raw_span: serde_json::from_str::<Value>(&row.get::<_, String>(14)?)?,
        })
    }

    fn row_to_dom_sheet(row: &Row<'_>) -> Result<DomSheetRecord, rusqlite::Error> {
        Ok(DomSheetRecord {
            sheet_id: row.get(0)?,
            snapshot_id: row.get(1)?,
            trace_id: row.get(2)?,
            correlation_id: row.get(3)?,
            dom_stability_score: row.get(4)?,
            dom_tree: serde_json::from_str::<Value>(&row.get::<_, String>(5)?)?,
            noise_stats: match row.get::<_, Option<String>>(6)? {
                Some(s) => Some(serde_json::from_str::<Value>(&s)?),
                None => None,
            },
        })
    }

    fn load_dom_sheets_for_correlation(
        &self,
        correlation_id: Option<String>,
    ) -> Result<Vec<DomSheetRecord>, JavaspectreError> {
        let Some(cid) = correlation_id else {
            return Ok(Vec::new());
        };
        let conn = &*self.conn;
        let mut stmt = conn.prepare(
            r#"
            SELECT
              sheet_id, snapshot_id, trace_id, correlation_id,
              dom_stability_score, dom_tree, noise_stats
            FROM dom_sheets
            WHERE correlation_id = ?1
            ORDER BY dom_stability_score DESC
            "#,
        )?;
        let iter = stmt.query_map(params![cid], |row| Self::row_to_dom_sheet(row))?;
        let mut out = Vec::new();
        for item in iter {
            out.push(item?);
        }
        Ok(out)
    }

    /// Compute a simple DOM stability score and persist back into dom_sheets.
    /// This is a placeholder scoring engine that can be replaced by Cybercore-Brain logic.
    pub fn recompute_dom_stability_scores(&self) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;

        let mut stmt = conn.prepare(
            r#"
            SELECT sheet_id, dom_tree
            FROM dom_sheets
            "#,
        )?;

        let mut to_update: Vec<(String, f64)> = Vec::new();
        let mut rows = stmt.query(NO_PARAMS)?;
        while let Some(row) = rows.next()? {
            let sheet_id: String = row.get(0)?;
            let dom_tree_str: String = row.get(1)?;
            let dom_tree: Value = serde_json::from_str(&dom_tree_str)?;
            let score = Self::compute_dom_stability(&dom_tree);
            to_update.push((sheet_id, score));
        }

        let tx = conn.unchecked_transaction()?;
        {
            let mut upd = tx.prepare(
                r#"
                UPDATE dom_sheets
                SET dom_stability_score = ?2
                WHERE sheet_id = ?1
                "#,
            )?;
            for (sheet_id, score) in to_update {
                upd.execute(params![sheet_id, score])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    /// Simple stability heuristic: fewer dynamic classes/ids => higher score.
    fn compute_dom_stability(dom_tree: &Value) -> f64 {
        fn count_dynamic(v: &Value, dynamic_ids: &mut i64, total_nodes: &mut i64) {
            match v {
                Value::Object(map) => {
                    if let Some(Value::String(id)) = map.get("id") {
                        if id.contains("uuid")
                            || id.contains("session")
                            || id.contains("abtest")
                            || id.chars().any(|c| c.is_ascii_digit())
                        {
                            *dynamic_ids += 1;
                        }
                    }
                    if let Some(Value::String(class)) = map.get("class") {
                        if class.contains("uuid")
                            || class.contains("session")
                            || class.contains("abtest")
                        {
                            *dynamic_ids += 1;
                        }
                    }
                    *total_nodes += 1;
                    for (_, child) in map {
                        count_dynamic(child, dynamic_ids, total_nodes);
                    }
                }
                Value::Array(arr) => {
                    for child in arr {
                        count_dynamic(child, dynamic_ids, total_nodes);
                    }
                }
                _ => {}
            }
        }

        let mut dynamic_ids = 0;
        let mut total_nodes = 0;
        count_dynamic(dom_tree, &mut dynamic_ids, &mut total_nodes);

        if total_nodes == 0 {
            return 0.0;
        }

        let ratio = dynamic_ids as f64 / total_nodes as f64;
        (1.0 - ratio).clamp(0.0, 1.0)
    }

    /// Example virtual-object cluster query for a correlation window.
    pub fn load_virtual_object_cluster(
        &self,
        correlation_id: &str,
    ) -> Result<VirtualObjectCluster, JavaspectreError> {
        let conn = &*self.conn;

        // Spans
        let mut span_stmt = conn.prepare(
            r#"
            SELECT
              span_id, trace_id, parent_span_id, start_time_ns, end_time_ns,
              span_name, span_kind, status_code, service_name,
              http_method, http_route, correlation_id,
              attributes, resource, raw_span
            FROM spans
            WHERE correlation_id = ?1
            ORDER BY start_time_ns ASC
            "#,
        )?;
        let span_iter = span_stmt.query_map(params![correlation_id], |row| {
            Self::row_to_span(row)
        })?;
        let mut spans = Vec::new();
        for s in span_iter {
            spans.push(s?);
        }

        // DOM sheets
        let mut dom_stmt = conn.prepare(
            r#"
            SELECT
              sheet_id, snapshot_id, trace_id, correlation_id,
              dom_stability_score, dom_tree, noise_stats
            FROM dom_sheets
            WHERE correlation_id = ?1
            ORDER BY dom_stability_score DESC
            "#,
        )?;
        let dom_iter = dom_stmt.query_map(params![correlation_id], |row| {
            Self::row_to_dom_sheet(row)
        })?;
        let mut dom_sheets = Vec::new();
        for d in dom_iter {
            dom_sheets.push(d?);
        }

        // HAR entries
        let mut har_stmt = conn.prepare(
            r#"
            SELECT
              entry_id, correlation_id, started_at_ns, method,
              url, status, request_json, response_json, raw_entry
            FROM har_entries
            WHERE correlation_id = ?1
            ORDER BY started_at_ns ASC
            "#,
        )?;
        let har_iter = har_stmt.query_map(params![correlation_id], |row| {
            Ok(HarEntryRecord {
                entry_id: row.get(0)?,
                correlation_id: row.get(1)?,
                started_at_ns: row.get(2)?,
                method: row.get(3)?,
                url: row.get(4)?,
                status: row.get(5)?,
                request_json: match row.get::<_, Option<String>>(6)? {
                    Some(s) => Some(serde_json::from_str::<Value>(&s)?),
                    None => None,
                },
                response_json: match row.get::<_, Option<String>>(7)? {
                    Some(s) => Some(serde_json::from_str::<Value>(&s)?),
                    None => None,
                },
                raw_entry: serde_json::from_str::<Value>(&row.get::<_, String>(8)?)?,
            })
        })?;
        let mut har_entries = Vec::new();
        for h in har_iter {
            har_entries.push(h?);
        }

        Ok(VirtualObjectCluster {
            correlation_id: correlation_id.to_string(),
            spans,
            dom_sheets,
            har_entries,
        })
    }
}

/// Represents a Javaspectre "virtual object" cluster across traces, DOM, and HAR.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualObjectCluster {
    pub correlation_id: String,
    pub spans: Vec<SpanRecord>,
    pub dom_sheets: Vec<DomSheetRecord>,
    pub har_entries: Vec<HarEntryRecord>,
}

/// Example integration point with a higher-level ScoreEngine.
/// Scores can be computed by Cybercore-Brain and persisted into auxiliary tables.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterScore {
    pub correlation_id: String,
    pub stability_score: f64,
    pub novelty_score: f64,
    pub drift_score: f64,
}

impl JavaspectreStore {
    pub fn init_score_table(&self) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS cluster_scores (
              correlation_id TEXT PRIMARY KEY,
              stability_score REAL NOT NULL,
              novelty_score REAL NOT NULL,
              drift_score REAL NOT NULL,
              updated_at_ns INTEGER NOT NULL
            );
            "#,
        )?;
        Ok(())
    }

    pub fn upsert_cluster_score(
        &self,
        score: &ClusterScore,
        updated_at_ns: i64,
    ) -> Result<(), JavaspectreError> {
        let conn = &*self.conn;
        conn.execute(
            r#"
            INSERT INTO cluster_scores (
              correlation_id, stability_score, novelty_score,
              drift_score, updated_at_ns
            ) VALUES (?1, ?2, ?3, ?4, ?5)
            ON CONFLICT(correlation_id) DO UPDATE SET
              stability_score = excluded.stability_score,
              novelty_score = excluded.novelty_score,
              drift_score = excluded.drift_score,
              updated_at_ns = excluded.updated_at_ns
            "#,
            params![
                score.correlation_id,
                score.stability_score,
                score.novelty_score,
                score.drift_score,
                updated_at_ns
            ],
        )?;
        Ok(())
    }

    pub fn load_cluster_score(
        &self,
        correlation_id: &str,
    ) -> Result<Option<ClusterScore>, JavaspectreError> {
        let conn = &*self.conn;
        let mut stmt = conn.prepare(
            r#"
            SELECT correlation_id, stability_score, novelty_score, drift_score
            FROM cluster_scores
            WHERE correlation_id = ?1
            "#,
        )?;
        let mut rows = stmt.query(params![correlation_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(ClusterScore {
                correlation_id: row.get(0)?,
                stability_score: row.get(1)?,
                novelty_score: row.get(2)?,
                drift_score: row.get(3)?,
            }))
        } else {
            Ok(None)
        }
    }
}

/// Optional helper to build endpoint_key from method and normalized route.
pub fn build_endpoint_key(method: &str, route: &str) -> String {
    format!("{} {}", method.to_uppercase(), route)
}

/// A minimal hash helper for content-addressed snapshots.
/// In a production system, this should use a proven SHA-256 implementation.
pub fn stable_snapshot_hash(payload: &Value) -> Result<String, JavaspectreError> {
    use sha2::{Digest, Sha256};

    let canonical = canonical_json(payload)?;
    let mut hasher = Sha256::new();
    hasher.update(canonical.as_bytes());
    let digest = hasher.finalize();
    Ok(hex::encode(digest))
}

/// Canonical JSON serialization to provide deterministic hashes.
fn canonical_json(value: &Value) -> Result<String, JavaspectreError> {
    fn sort_value(v: &Value) -> Value {
        match v {
            Value::Object(map) => {
                let mut entries: Vec<_> = map.iter().collect();
                entries.sort_by(|a, b| a.0.cmp(b.0));
                let mut ordered = serde_json::map::Map::new();
                for (k, v) in entries {
                    ordered.insert(k.clone(), sort_value(v));
                }
                Value::Object(ordered)
            }
            Value::Array(arr) => {
                Value::Array(arr.iter().map(sort_value).collect())
            }
            _ => v.clone(),
        }
    }

    let sorted = sort_value(value);
    Ok(serde_json::to_string(&sorted)?)
}

/// Example: ingest a raw OpenTelemetry span JSON blob into the spans table.
/// This function extracts a few common attributes but keeps the payload semi-structured.
pub fn ingest_otel_span(
    store: &JavaspectreStore,
    raw_span_json: &str,
) -> Result<(), JavaspectreError> {
    let raw: Value = serde_json::from_str(raw_span_json)?;
    let span_id = raw
        .get("span_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| JavaspectreError::Schema("missing span_id".into()))?
        .to_string();
    let trace_id = raw
        .get("trace_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| JavaspectreError::Schema("missing trace_id".into()))?
        .to_string();

    let parent_span_id = raw.get("parent_span_id").and_then(|v| v.as_str()).map(|s| s.to_string());
    let start_time_ns = raw
        .get("start_time_unix_nano")
        .or_else(|| raw.get("start_time_ns"))
        .and_then(|v| v.as_str().and_then(|s| s.parse::<i64>().ok()).or_else(|| v.as_i64()))
        .ok_or_else(|| JavaspectreError::Schema("missing start_time_ns".into()))?;
    let end_time_ns = raw
        .get("end_time_unix_nano")
        .or_else(|| raw.get("end_time_ns"))
        .and_then(|v| v.as_str().and_then(|s| s.parse::<i64>().ok()).or_else(|| v.as_i64()))
        .ok_or_else(|| JavaspectreError::Schema("missing end_time_ns".into()))?;

    let span_name = raw
        .get("name")
        .or_else(|| raw.get("span_name"))
        .and_then(|v| v.as_str())
        .unwrap_or("unknown_span")
        .to_string();

    let span_kind = raw
        .get("kind")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    // Extract attributes map if present.
    let attributes = raw
        .get("attributes")
        .cloned()
        .unwrap_or_else(|| Value::Object(serde_json::map::Map::new()));

    // Resource can be nested or separate.
    let resource = raw
        .get("resource")
        .cloned()
        .unwrap_or_else(|| Value::Object(serde_json::map::Map::new()));

    let service_name = attributes
        .get("service.name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let http_method = attributes
        .get("http.method")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let http_route = attributes
        .get("http.route")
        .or_else(|| attributes.get("http.target"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let status_code_attr = attributes
        .get("http.status_code")
        .and_then(|v| v.as_i64())
        .map(|c| c.to_string());

    let status_code = raw
        .get("status")
        .and_then(|st| st.get("code"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or(status_code_attr);

    // Correlation ID can be in baggage, attributes, or custom fields.
    let correlation_id = attributes
        .get("correlation_id")
        .or_else(|| attributes.get("correlation.id"))
        .or_else(|| attributes.get("session.id"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let span_record = SpanRecord {
        span_id,
        trace_id,
        parent_span_id,
        start_time_ns,
        end_time_ns,
        span_name,
        span_kind,
        status_code,
        service_name,
        http_method,
        http_route,
        correlation_id,
        attributes,
        resource,
        raw_span: raw,
    };

    store.upsert_span(&span_record)?;
    Ok(())
}

/// Example: ingest a generic DOM snapshot JSON string.
pub fn ingest_dom_snapshot(
    store: &JavaspectreStore,
    snapshot_id: &str,
    trace_id: Option<&str>,
    correlation_id: Option<&str>,
    captured_at_ns: i64,
    dom_json: &str,
) -> Result<(), JavaspectreError> {
    let raw_dom: Value = serde_json::from_str(dom_json)?;
    let snap = DomSnapshotRecord {
        snapshot_id: snapshot_id.to_string(),
        trace_id: trace_id.map(|s| s.to_string()),
        correlation_id: correlation_id.map(|s| s.to_string()),
        captured_at_ns,
        raw_dom,
    };
    store.insert_dom_snapshot(&snap)?;
    Ok(())
}

/// Example: derive a simple DOM sheet from a snapshot by picking out roles and node grid.
/// Real systems can plug in a more advanced stabilizer here.
pub fn derive_dom_sheet_from_snapshot(
    store: &JavaspectreStore,
    sheet_id: &str,
    snapshot_id: &str,
    dom_snapshot: &DomSnapshotRecord,
) -> Result<(), JavaspectreError> {
    // Example spec-aligned structure: root-level object with roles and basic tag summary.
    let dom_tree = json!({
        "roles": {
            "button_count": count_nodes_with_tag(&dom_snapshot.raw_dom, "button"),
            "link_count": count_nodes_with_tag(&dom_snapshot.raw_dom, "a"),
            "input_count": count_nodes_with_tag(&dom_snapshot.raw_dom, "input"),
        },
        "meta": {
            "origin_trace_id": dom_snapshot.trace_id,
            "origin_correlation_id": dom_snapshot.correlation_id,
        }
    });

    let mut noise_stats_map = serde_json::map::Map::new();
    noise_stats_map.insert(
        "dynamic_id_count".to_string(),
        json!(estimate_dynamic_ids(&dom_snapshot.raw_dom)),
    );
    let noise_stats = Value::Object(noise_stats_map);

    let dom_stability_score = Some(JavaspectreStore::compute_dom_stability(&dom_tree));

    let sheet = DomSheetRecord {
        sheet_id: sheet_id.to_string(),
        snapshot_id: snapshot_id.to_string(),
        trace_id: dom_snapshot.trace_id.clone(),
        correlation_id: dom_snapshot.correlation_id.clone(),
        dom_stability_score,
        dom_tree,
        noise_stats: Some(noise_stats),
    };

    store.insert_dom_sheet(&sheet)?;
    Ok(())
}

fn count_nodes_with_tag(dom: &Value, tag: &str) -> i64 {
    fn recurse(v: &Value, tag: &str, count: &mut i64) {
        match v {
            Value::Object(map) => {
                if let Some(Value::String(t)) = map.get("tag") {
                    if t.eq_ignore_ascii_case(tag) {
                        *count += 1;
                    }
                }
                for (_, child) in map {
                    recurse(child, tag, count);
                }
            }
            Value::Array(arr) => {
                for child in arr {
                    recurse(child, tag, count);
                }
            }
            _ => {}
        }
    }
    let mut count = 0;
    recurse(dom, tag, &mut count);
    count
}

fn estimate_dynamic_ids(dom: &Value) -> i64 {
    fn recurse(v: &Value, count: &mut i64) {
        match v {
            Value::Object(map) => {
                if let Some(Value::String(id)) = map.get("id") {
                    if id.contains("uuid")
                        || id.contains("session")
                        || id.contains("abtest")
                        || id.chars().any(|c| c.is_ascii_digit())
                    {
                        *count += 1;
                    }
                }
                for (_, child) in map {
                    recurse(child, count);
                }
            }
            Value::Array(arr) => {
                for child in arr {
                    recurse(child, count);
                }
            }
            _ => {}
        }
    }
    let mut count = 0;
    recurse(dom, &mut count);
    count
}

// The file intentionally contains only Rust code and is ready to be integrated
// into the broader Cybercore-Brain / Cyberswarm ecosystem as a storage and
// correlation subsystem for Javaspectre.
