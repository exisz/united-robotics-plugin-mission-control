# Mission Control

Two independent Capital plugin windows: `runs` (AG Grid, newest 100 scheduler runs per page, page-local search, full evidence on row click) and `architecture` (ordered routing tree, audit counter, pending task and scoped waits).

The existing World one-shot backend reads only `WORLD_PLUGIN_STATE_DIR/snapshot.json`. No network service, credentials, scheduler mutations, arbitrary path or command inputs. Missing data is an error, never a fabricated empty success. Data older than two hours is visibly marked. Snapshot export is atomic; malformed JSONL records are counted. Old logs have no invented self-summary.

LoreMaster owns `cron/mission_control.py`, `cron/architecture.json`, and the source `cron/pod_launches.jsonl`. Each non-dry-run scheduler invocation projects its current ledger/state to the existing Capital host mount at `plugin-data/mission-control/snapshot.json`. The exporter can also be run explicitly after recovery. Source JSONL remains append-only; only concise per-run fields and bounded evidence reach the panel. Full original evidence stays in LoreMaster.

Runtime state must not be committed to this public artifact repository. Publish immutable `dist/manifest.json`, `dist/plugin.js`, `dist/rpc.mjs` from a pinned Git SHA. `npm ci && npm run check`; CI checks reproducible artifacts.

Rollback: restore Capital's previous panel definitions. Removing panels does not delete source logs or plugin state.
