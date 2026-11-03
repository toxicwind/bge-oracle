# Changelog

## 1.0.0 — 2026-11-02

### Added
- `@bge/lib` — canonical bge-m3 embedding lane (moved from forge/hf, renamed from the
  HuggingFace-era `hf` moniker).
- **Any OpenAI-compatible `/v1/embeddings` endpoint** via `BGE_EMBED_BASE_URL`
  (default: freeinference.org). No longer freeinference-only.
- API key resolution: **secretsmith keyring first** (estate SSOT), then
  `FREEINFERENCE_API_KEY` / `HF_API_KEY` env, then `.env`.
- `embedOne`, `embedClassify`, `categorizeRepos` alongside `embedMany`/`cosine`.
- Oracle W1–W11 + `firewallClassify` stream-leak detector.
- `bge` CLI: `classify | embed | oracle w1..w11|all | firewall`.
- TypeScript-strict; dim-mismatch guard on `cosine`.

### Changed
- `forge hf` now delegates to the canonical `bge-oracle/bge/cli.ts` (single source of truth).

### Fixed
- Key resolution no longer hardcodes the secretsmith shell one-liner as the only path.