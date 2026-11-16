// @ts-nocheck
/**
 * embed.ts — provider-agnostic embedding primitives.
 * cosine/groupStats are pure math; embedMany routes through the provider
 * registry (providers/types.ts), so the caller is decoupled from which
 * backend (freeinference, nvidia, …) is active.
 */
import { getProvider, listProviders } from "./providers/types.ts";

export const fmt = (v) => v.toFixed(4);

/** Cosine similarity between two equal-length vectors. */
export function cosine(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (na * nb) || 0;
}

/** Embed many texts via the active provider. */
export async function embedMany(texts) {
  return getProvider().embedMany(texts);
}

/** Mean pairwise cosine within a group, and mean cross-group cosine. */
export function groupStats() {
  const avgV = (v) => { let s = 0, n = 0; for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) { s += cosine(v[i], v[j]); n++; } return n ? s / n : 0; };
  const crossV = (a, b) => { let s = 0, n = 0; for (const x of a) for (const y of b) { s += cosine(x, y); n++; } return s / n; };
  return { avgV, crossV };
}

/** Active provider id + available providers (for /health + diagnostics). */
export function providerInfo() {
  const p = getProvider();
  return { active: p.name, model: p.model, providers: listProviders(), ...p.health() };
}