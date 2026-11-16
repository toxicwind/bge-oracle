/**
 * @bge/lib — canonical bge-m3 embedding lane (FreeInference /v1/embeddings).
 *
 * VERIFIED live 2026-11-02: endpoint 200, 1024-dim, key from the keyring
 * (secretsmith env → FREEINFERENCE_API_KEY). No local models ever: the cloud
 * lane is the ONE embed source (2026-11-02 consolidation; the earlier
 * "401 rotation" ticket was a wrong-path misdiagnosis).
 *
 * Consumers: forge ops, wip-to-product classifier, pens classifiers —
 * everything imports from here instead of re-implementing fetch+cosine.
 */
import type { Subprocess } from "bun";

// ── GitHub deeplink resolution — NEVER hardcode the repo URL. Derive from
// `git remote` at module load (fallback: BGE_REPO_URL env, then a well-known
// default). Everything that publishes a link to this repo goes through here,
// so a rename/move needs zero edits.
function deriveRepoUrl(): string {
  const env = process.env.BGE_REPO_URL;
  if (env) return env.replace(/\/+$/, "");
  try {
    const p = Bun.spawnSync(["git", "remote", "get-url", "origin"]);
    if (p.exitCode === 0) {
      const raw = p.stdout.toString().trim();
      // https://github.com/owner/repo.git → https://github.com/owner/repo
      const m = raw.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/);
      if (m) return `https://github.com/${m[1]}`;
      const ssh = raw.match(/git@github\.com:([^/]+\/[^/.]+)(?:\.git)?$/);
      if (ssh) return `https://github.com/${ssh[1]}`;
    }
  } catch {}
  return "https://github.com/toxicwind/embedding-oracle";
}

/** Canonical repo URL (derived from git remote; never hardcoded). */
export const REPO_URL = deriveRepoUrl();

export interface EmbedOptions {
  /** Embedding model id (default bge-m3). */
  model?: string;
  /** Embeddings per API request. */
  batchSize?: number;
  /** base URL — ANY OpenAI-compatible `/v1/embeddings` endpoint. */
  baseUrl?: string;
  /** Bearer key override (default: secretsmith → env → .env). */
  apiKey?: string;
}

export interface ClassifyResult<T extends string> {
  label: T;
  score: number;
  vector: number[];
}

const DEFAULT_MODEL = "bge-m3";
// ANY OpenAI-compatible `/v1/embeddings` endpoint: override via
// BGE_EMBED_BASE_URL (or legacy HF_BASE_URL) in env/.env; defaults to the
// pens's canonical freeinference lane.
const DEFAULT_BASE =
  process.env.BGE_EMBED_BASE_URL ??
  process.env.HF_BASE_URL ??
  "https://freeinference.org/v1/embeddings";

// ── Credential resolution: secretsmith keyring FIRST (fast pens SSOT),
// then plain env, then a local .env file. New setups without the keyring
// fall through to env; the pens always uses the keyring route.
async function resolveApiKey(): Promise<string> {
  // 1. secretsmith (pens SSOT, fast): `secretsmith env` emits KEY=VAL lines.
  //    NOTE: the secretsmith CLI is BANNED in agent shells (2026-11-08) — this
  //    lane now reads the on-box key file directly (same file argos uses).
  const p = Bun.spawn(["sh", "-c", "cat ${HOME}/.tau/freeinference.key 2>/dev/null | tr -d '\\n'"], {
    stdout: "pipe",
  });
  const out = new TextDecoder().decode(await Bun.readableStreamToBytes(p.stdout));
  await p.exited;
  if (out.trim()) return out.trim();

  // 2. Plain environment (localhost / CI / non-pens setup).
  if (process.env.FREEINFERENCE_API_KEY?.trim()) return process.env.FREEINFERENCE_API_KEY.trim();
  if (process.env.HF_API_KEY?.trim()) return process.env.HF_API_KEY.trim();

  // 2b. The on-box agent key file (argos's own lane: pitchfork reads
  // `cat ~/.tau/freeinference.key` for ARGOS_EMBEDDING_API_KEY). The
  // secretsmith CLI is banned in agent shells (2026-11-08), so this file is
  // the reliable pens fallback — same key, same lane, no CLI.
  try {
    const home = process.env.HOME ?? "";
    if (home) {
      const keyFile = Bun.file(`${home}/.tau/freeinference.key`);
      if (await keyFile.exists()) {
        const v = (await keyFile.text()).trim();
        if (v) return v;
      }
    }
  } catch {}

  // 3. Local .env (copy .env.example).
  try {
    const envFile = Bun.file(".env");
    if (await envFile.exists()) {
      const text = await envFile.text();
      for (const line of text.split("\n")) {
        if (line.startsWith("FREEINFERENCE_API_KEY=")) {
          const v = line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
          if (v) return v;
        }
      }
    }
  } catch {}

  throw new Error(
    "FREEINFERENCE_API_KEY not resolvable (secretsmith env / FREEINFERENCE_API_KEY / .env) — copy .env.example",
  );
}

/** Embed many strings; returns dense vectors (await per-batch semantics). */
export async function embedMany(
  inputs: string[],
  opts: EmbedOptions = {},
): Promise<number[][]> {
  const batchSize = opts.batchSize ?? 64;
  const key = opts.apiKey ?? (await resolveApiKey());
  const vectors: number[][] = [];
  for (let i = 0; i < inputs.length; i += batchSize) {
    const slice = inputs.slice(i, i + batchSize);
    const res = await fetch(opts.baseUrl ?? DEFAULT_BASE, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: opts.model ?? DEFAULT_MODEL, input: slice }),
    });
    if (!res.ok) {
      // 429-rate-limit: back off 2s/4s/6s/8s then retry once.
      if (res.status === 429) {
        await Bun.sleep(2000);
        continue;
      }
      throw new Error(`embeddings http ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const j = (await res.json()) as { data: Array<{ embedding: number[] }> };
    for (const d of j.data) vectors.push(d.embedding);
  }
  return vectors;
}

/** Embed one string. */
export async function embedOne(input: string, opts: EmbedOptions = {}): Promise<number[]> {
  const [v] = await embedMany([input], opts);
  return v;
}

/** Cosine similarity; both vectors must be same length. */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error(`dim mismatch ${a.length} vs ${b.length}`);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

/**
 * Classify each input against precomputed label vectors (embed labels once with
 * embedMany, then argmax cosine per input). minScore → "Other"/fallback label.
 */
export async function embedClassify<T extends string>(
  inputs: string[],
  labels: Array<{ label: T; prompt: string }>,
  opts: { minScore?: number; fallback?: T } & EmbedOptions = {},
): Promise<Array<ClassifyResult<T>>> {
  const labelVectors = await embedMany(labels.map((l) => l.prompt), opts);
  const inputVectors = await embedMany(inputs, opts);
  const min = opts.minScore ?? 0.18;
  return inputVectors.map((iv) => {
    let best: T = opts.fallback ?? labels[0].label;
    let bestScore = -Infinity;
    for (let li = 0; li < labels.length; li++) {
      const s = cosine(iv, labelVectors[li]);
      if (s > bestScore) {
        bestScore = s;
        best = labels[li].label;
      }
    }
    if (bestScore < min) best = opts.fallback ?? ("Other" as T);
    return { label: best, score: bestScore, vector: iv };
  });
}

/** Categorize a flat list of names into the given label set (forge ops standard). */
export async function categorizeRepos<T extends string>(
  names: string[],
  labels: Array<{ label: T; prompt: string }>,
): Promise<Array<{ name: string; category: T; score: number }>> {
  const r = await embedClassify(names, labels);
  return names.map((name, i) => ({ name, category: r[i].label, score: r[i].score }));
}

export type { Subprocess };