# bge-oracle

<div align="center">

**The canonical bge-m3 embedding lane — any OpenAI-compatible `/v1/embeddings` server, one import.**

[![Bun](https://img.shields.io/badge/Bun-1.4.4-black?logo=bun&style=for-the-badge)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&style=for-the-badge)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen?style=for-the-badge)](#-install)

</div>

---

## Why you should care

Everyone needs embeddings. Nobody needs to re-implement `fetch` + `cosine`. **bge-oracle** is the
one-import embedding lane: batch, classify, search, and oracle-test against **any** OpenAI-compatible
`/v1/embeddings` endpoint — freeinference.org by default (bge-m3, 1024-dim, unlimited/free).

```ts
import { embedMany, embedClassify, cosine } from "bge-oracle/bge";

const [v1, v2] = await embedMany(["estate control plane", "bge-m3 embeddings"]);
console.log(cosine(v1, v2)); // 0.46

const [r] = await embedClassify("git push origin main", [
  { label: "Coding", prompt: "software development, git, code" },
]);
console.log(r.label); // "Coding"
```

## Features

- **One import, any endpoint** — freeinference default, or point at vllm/sglang/Ollama/anything
  exposing the OpenAI embeddings contract
- **Batcher built in** — automatic chunking (default 64/request), 429 backoff
- **Classify by proximity** — argmax cosine with `minScore` + fallback
- **Deterministic** — W9 proves same-text cross-call cosine = 1.0
- **11-workstream oracle** — compositionality, semantic firewall, unicode geometry,
  injection detection, protocol fingerprinting
- **9.8k tokens to test** 😉 — smoke-test the lane with one command

## Quick start

```bash
# 1. Get a key (secretsmith on the estate, FREEINFERENCE_API_KEY elsewhere)
cp .env.example .env

# 2. Install + smoke-test the lane
bun install
bun run embed "estate control plane"

# 3. Classify anything
bun run classify "git push origin main" --labels "Coding:code,DevOps:deploy"
```

## The oracle

```bash
bun run oracle          # W1..W11 — 11 bge-m3 black-box experiments, live
bun run firewall "..."  # is this stream chunk markup or prose?
```

## Config

| Env | Default | Meaning |
|---|---|---|
| `FREEINFERENCE_API_KEY` | (secretsmith keyring on the estate) | API key |
| `BGE_EMBED_BASE_URL` | `https://freeinference.org/v1/embeddings` | Any OpenAI-compat endpoint |
| `BGE_EMBED_MODEL` | `bge-m3` | Embedding model id |

The estate resolves keys via **secretsmith keyring first** (fastest), then env, then `.env`.

## Architecture

```mermaid
graph LR
    A[embedMany / embedClassify] --> B[@bge/lib]
    B --> C{resolveApiKey}
    C --> D[secretsmith keyring]
    C --> E[env / .env]
    B --> F[freeinference /v1/embeddings]
```

- `bge/bge.ts` — the canonical lib (`embedMany`, `embedOne`, `cosine`, `embedClassify`, `categorizeRepos`)
- `bge/oracle.ts` — W1-W11 experiments
- `bge/cli.ts` — `bge` binary (classify / embed / oracle / firewall)

## Roadmap

- [x] Canonical lib + oracle W1-W11
- [x] Any-OpenAI-compat endpoint support
- [ ] Qdrant-native store integration
- [ ] Publish to npm + GitHub Actions CI

## License

MIT — see [LICENSE](LICENSE).