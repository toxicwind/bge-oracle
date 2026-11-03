# Contributing

Thanks for contributing to bge-oracle! Keep it simple:

## Setup

```bash
bun install
cp .env.example .env   # add FREEINFERENCE_API_KEY (or rely on secretsmith)
bun test
```

## Tests

`bun test` runs the unit suite. The oracle (`bun run oracle`) hits the live
embedding endpoint — it needs a key and is not part of CI.

## PR process

1. Branch off `main`, keep changes focused.
2. Add a test for any behavior change (`test/`, or `bge/bge.test.ts`).
3. `bun test` green + `bun x tsc --noEmit` clean.
4. Describe the change and why — one paragraph, concrete.
5. CI runs the same checks; green = merged.

## Structure

- `bge/bge.ts` — the lib (embedMany / cosine / classify)
- `bge/oracle.ts` — W1-W11 experiments
- `bge/cli.ts` — the `bge` binary
- `test/` — unit tests

Keep the lib dependency-free: everything imports from `bge/bge.ts`,
nothing re-implements fetch+cosine.