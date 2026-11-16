// @ts-nocheck
/**
 * freeinference.ts — freeinference.org/HF-compatible embedding backend.
 * Base URL + key from env (HF_BASE_URL / HF_API_KEY, or FREEINFERENCE_*).
 */
import type { EmbedProvider } from "./types.ts";
import { readFileSync } from "node:fs";

const BASE = process.env.HF_BASE_URL
  ?? process.env.FREEINFERENCE_BASE_URL
  ?? "https://freeinference.org/v1";
// Key precedence: env → the pens's established key file (~/.tau/freeinference.key,
// which tau + kappa both use for the direct bge-m3 lane).
function readKey(): string {
  if (process.env.HF_API_KEY || process.env.HF_TOKEN || process.env.FREEINFERENCE_API_KEY) {
    return process.env.HF_API_KEY ?? process.env.HF_TOKEN ?? process.env.FREEINFERENCE_API_KEY ?? "";
  }
  try { return readFileSync("/home/toxic/.tau/freeinference.key", "utf8").trim(); } catch { return ""; }
}
const KEY = readKey();
const MODEL = "bge-m3";

export const freeinferenceProvider: EmbedProvider = {
  name: "freeinference",
  model: MODEL,
  async embedMany(texts) {
    const res = await fetch(BASE + "/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY },
      body: JSON.stringify({ model: MODEL, input: texts }),
    });
    if (!res.ok) throw new Error(`freeinference embed ${res.status}: ${await res.text()}`);
    const j = await res.json();
    return j.data.map((d) => d.embedding);
  },
  health() { return { backend: BASE, key: !!KEY }; },
};