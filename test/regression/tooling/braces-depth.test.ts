import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const requireCjs = createRequire(import.meta.url);
// Resolve exactly what micromatch loads, rather than testing only the source copy.
const requireMicromatch = createRequire(requireCjs.resolve("micromatch"));
const braces = requireMicromatch("braces");
const micromatch = requireCjs("micromatch");
const fastGlob = requireCjs("fast-glob");

describe("braces security backport", () => {
  it("uses the patched package throughout the glob dependency chain", () => {
    expect(requireMicromatch("braces/package.json").name).toBe("@subboost/braces");
  });

  it.each(["{", "("])("rejects deeply nested %s groups before recursive walking", (open) => {
    const close = open === "{" ? "}" : ")";
    const pattern = open.repeat(4000) + "a,b" + close.repeat(4000);
    for (const operation of [braces, braces.parse, braces.compile, braces.expand, braces.stringify]) {
      expect(() => operation(pattern)).toThrow(new SyntaxError("Brace nesting exceeds maximum depth (100)"));
    }
    expect(() => braces.parse(open.repeat(4000))).toThrow(SyntaxError);
  });

  it("counts mixed nesting and preserves the supported depth boundary", () => {
    expect(() => braces.compile("{".repeat(100) + "a,b" + "}".repeat(100))).not.toThrow();
    expect(() => braces.expand("{".repeat(100) + "a,b" + "}".repeat(100))).not.toThrow();
    expect(() => braces.parse("{(".repeat(51) + "x" + ")}".repeat(51))).toThrow(SyntaxError);
  });

  it.each(["compile", "expand", "stringify"])("guards %s when parsing is bypassed", (method) => {
    let ast: Record<string, unknown> = { type: "text", value: "x" };
    for (let depth = 0; depth < 4000; depth++) ast = { type: "root", nodes: [ast] };
    expect(() => braces[method](ast)).toThrow(SyntaxError);
    const cyclic: Record<string, unknown> = { type: "root" };
    cyclic.nodes = [cyclic];
    expect(() => braces[method](cyclic)).toThrow(SyntaxError);
  });

  it("preserves glob, range, escape, quote, and bracket semantics", () => {
    expect(braces.expand("src/{app,lib}/file{1..2}.ts")).toEqual([
      "src/app/file1.ts", "src/app/file2.ts", "src/lib/file1.ts", "src/lib/file2.ts",
    ]);
    expect(braces.compile("{a,b}")).toBe("(a|b)");
    expect(braces.expand(String.raw`\{a,b\}`)).toEqual(["{a,b}"]);
    expect(() => braces.parse('"' + "{".repeat(200) + '"')).not.toThrow();
    expect(() => braces.parse("[" + "{".repeat(200) + "]")).not.toThrow();
    expect(() => braces.parse(String.raw`\{`.repeat(200))).not.toThrow();
    expect(micromatch(["src/a.ts", "src/b.tsx", "src/c.js"], "src/*.{ts,tsx}")).toEqual([
      "src/a.ts", "src/b.tsx",
    ]);
    expect(fastGlob.sync("vendor/braces/lib/{parse,compile}.js").sort()).toEqual([
      "vendor/braces/lib/compile.js", "vendor/braces/lib/parse.js",
    ]);
  });
});
