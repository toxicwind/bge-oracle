// @ts-nocheck
/**
 * nvidia.ts — NVIDIA NIM embedding backend.
 * Base URL + key from env (NVIDIA_BASE_URL / NVIDIA_API_KEY). Defaults to the
 * hosted integrate.api.nvidia.com NIM gateway; model override via
 * NVIDIA_EMBED_MODEL.
 */
import type { EmbedProvider } from "./types.ts";

const BASE = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const KEY = process.env.NVIDIA_API_KEY ?? "";
const MODEL = process.env.NVIDIA_EMBED_MODEL ?? "nvidia/nv-embed-qa-4";
const INPUT_TYPE = process.env.NVIDIA_EMBED_INPUT_TYPE ?? "query";

export const nvidiaProvider: EmbedProvider = {
  name: "nvidia",
  model: MODEL,
  async embedMany(texts) {
    // NIM embeddings use input_type + input, not `input` array of strings.
    const res = await fetch(BASE + "/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY },
      body: JSON.stringify({ model: MODEL, input: texts, input_type: INPUT_TYPE }),
    });
    if (!res.ok) throw new Error(`nvidia embed ${res.status}: ${await res.text()}`);
    const j = await res.json();
    return j.data.map((d) => d.embedding);
  },
  health() { return { backend: BASE, key: !!KEY }; },
};