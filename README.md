# bge-oracle

BGE-M3 multi-vector oracle experiments — W1 through W8.

Tests embedding geometry, semantic firewalls, protocol dialect fingerprinting, and
semantic drift signals.

## Usage

```bash
HF_API_KEY=your-key bun run oracle          # run W1-W8
HF_API_KEY=your-key HF_BASE_URL=https://example.com/v1 bun run oracle
```

## Workstreams

| ID | Name | Measures |
|---|---|---|
| W1 | Compositionality | sentence ≈ weighted token sum |
| W2 | Semantic firewall | markup-axis detector for leaked protocols |
| W3 | Unicode plane geometry | script clustering via char embeddings |
| W4 | Word order + negation | syntax semantics on the sphere |
| W5 | Multilingual pivot | cross-lingual identity |
| W6 | Length physics | meaning survival under padding |
| W7 | Injection detection | instructions vs data axis separation |
| W8 | Protocol dialect fingerprinting | multi-sample centroids, 18/18 hold-out |
