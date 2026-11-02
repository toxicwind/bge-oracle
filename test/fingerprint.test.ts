import { describe, it, expect } from "bun:test";

function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (na * nb) || 0;
}

describe("cosine()", () => {
  it("identical vectors have cosine 1", () => {
    const a = [1, 2, 3];
    expect(cosine(a, a)).toBeCloseTo(1, 4);
  });

  it("orthogonal vectors have cosine 0", () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosine(a, b)).toBeCloseTo(0, 4);
  });

  it("opposite vectors have cosine -1", () => {
    const a = [1, 0];
    const b = [-1, 0];
    expect(cosine(a, b)).toBeCloseTo(-1, 4);
  });
});
