// @ts-nocheck
/**
 * types.ts — embedding provider contract.
 *
 * Every embedding backend implements this so the daemon, workstreams, and
 * compare lane are provider-agnostic. Adding a new provider = one file in
 * providers/ that implements EmbedProvider + a register() call.
 */
export interface EmbedProvider {
  /** stable id, e.g. "freeinference" | "nvidia" */
  name: string;
  /** model id the provider serves embeddings with */
  model: string;
  /** embed many texts in one call → array of vectors */
  embedMany(texts: string[]): Promise<number[][]>;
  /** health/identity probe for /health */
  health(): { backend: string; key: boolean };
}

/** Registry: providers register by name; the daemon routes by EMBEDDING_PROVIDER. */
const registry = new Map<string, EmbedProvider>();
export function registerProvider(p: EmbedProvider): void { registry.set(p.name, p); }
export function getProvider(name?: string): EmbedProvider {
  const want = name ?? process.env.EMBEDDING_PROVIDER ?? "freeinference";
  const p = registry.get(want);
  if (!p) throw new Error(`unknown embedding provider "${want}"; known: ${listProviders().join(", ")}`);
  return p;
}
export function listProviders(): string[] { return [...registry.keys()]; }