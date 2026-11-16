#!/usr/bin/env bun
// @ts-nocheck
/**
 * embedding-oracle daemon — persistent BGE-M3 embedding server.
 *
 * Exposes the oracle's embed primitives over HTTP so the llama compare lane
 * (and anything else) can compute semantic similarity without re-embedding,
 * and without re-running the W1..W8 suite per call.
 *
 *   GET  /health      → 200 {ok, model, backend}
 *   POST /embeddings  → {model, embeddings: number[][]}   (input: string[])
 *   POST /similarity  → {pairs: [{a,b,cosine}]}           (input: {a:[], b:[]})
 *   GET  /oracle      → cached W1..W8 results (runs once, then caches)
 *
 * Run:  bun src/server.ts [--port 25260]   (key via HF_API_KEY/HF_BASE_URL env)
 */
import { embedMany, cosine, MODEL, HF_BASE, HF_KEY } from "./embed.ts";
import { run as runOracle } from "./oracle.ts";

const PORT = Number(process.argv.find((a) => a.startsWith("--port"))?.split("=")[1]
  ?? process.env.EMBEDDING_ORACLE_PORT ?? 25260);

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
});

let oracleCache = null;
async function getOracle() {
  if (oracleCache) return oracleCache;
  oracleCache = { model: MODEL, results: await runOracle() };
  return oracleCache;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === "GET" && p === "/health") {
      return json({ ok: true, model: MODEL, backend: HF_BASE, key: !!HF_KEY });
    }
    if (req.method === "GET" && p === "/oracle") {
      return json(await getOracle());
    }
    if (req.method !== "POST") return json({ error: "use POST" }, 405);
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
    if (p === "/embeddings") {
      const input = body.input ?? body.texts;
      if (!Array.isArray(input) || input.length === 0) return json({ error: "input: string[] required" }, 400);
      try {
        const embeddings = await embedMany(input);
        return json({ model: MODEL, embeddings, count: embeddings.length });
      } catch (e) { return json({ error: e.message }, 502); }
    }
    if (p === "/similarity") {
      const a = body.a, b = body.b;
      if (!Array.isArray(a) || !Array.isArray(b)) return json({ error: "a[] b[] required" }, 400);
      try {
        const [va, vb] = await Promise.all([embedMany(a), embedMany(b)]);
        const pairs = [];
        for (let i = 0; i < va.length; i++)
          for (let j = 0; j < vb.length; j++)
            pairs.push({ a: i, b: j, cosine: cosine(va[i], vb[j]) });
        return json({ model: MODEL, pairs });
      } catch (e) { return json({ error: e.message }, 502); }
    }
    return json({ error: "unknown route" }, 404);
  },
});

console.log(`embedding-oracle daemon: http://127.0.0.1:${server.port} (model=${MODEL})`);
if (import.meta.main) { /* keep alive */ }