#!/usr/bin/env bun
// @ts-nocheck
/**
 * embedding-oracle — entry point.
 * Re-exports the embed primitives, workstreams, and oracle runner from their
 * modules; guarded so `bun run src/index.mjs` runs the W1..W8 suite and the
 * bin (`bun bin/embedding-oracle`) drives it via the exported `run`.
 */
export { cosine, embedMany, MODEL, HF_BASE, HF_KEY } from "./embed.ts";
export { w1, w2, w3, w4, w5, w6, w7, w8, WORKSTREAMS } from "./workstreams.ts";
export { run } from "./oracle.ts";

if (import.meta.main) {
  run();
}