// @ts-nocheck
/**
 * oracle.ts — the W1..W8 oracle runner.
 * Runs every workstream, tolerating per-W failures, and returns the signals
 * keyed by workstream id. Pure orchestration — the experiments live in
 * workstreams.ts, the embed primitives in embed.ts.
 */
import { HF_KEY } from "./embed.ts";
import { WORKSTREAMS } from "./workstreams.ts";

/** Run all 8 workstreams; returns { w1: number|{error}, ... } and logs each. */
export async function run(): Promise<Record<string, unknown>> {
  console.log("=== bge-m3 oracle: W1..W8 ===");
  if (!HF_KEY) { console.error("HF_API_KEY required"); process.exit(1); }
  const results: Record<string, unknown> = {};
  for (const [id, fn] of Object.entries(WORKSTREAMS)) {
    try { results[id] = await fn(); }
    catch (e) { console.error(`${id} fail:`, (e as Error).message); results[id] = { error: (e as Error).message }; }
  }
  console.log("\n=== all 8 workstreams executed ===");
  return results;
}