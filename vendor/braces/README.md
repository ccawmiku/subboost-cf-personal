# Bounded braces fork

This private, vendored package contains the MIT-licensed source of
[`braces@3.0.3`](https://registry.npmjs.org/braces/-/braces-3.0.3.tgz).
The original copyright and license are preserved in `LICENSE`.

It addresses [CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
for which upstream has no patched release as of 2026-10-16. The changes are:

- Reject parser nesting above 100 groups, counting both braces and parentheses.
- Guard the recursive compile, expand, and stringify walkers as well, including
  callers supplying an AST directly or a cyclic AST.
- Preserve normal pattern syntax, exports, and the existing length/range limits.

The root dependency override directs transitive consumers to this source. The
package has its own name and version to identify the patched fork; this is not
an upstream release. `npm audit` does not inspect vendored JavaScript, so the
regression tests in `test/regression/tooling/braces-depth.test.ts` are required
in addition to the registry audit. They exercise the installed transitive
dependency, malicious patterns, direct ASTs, and normal glob behavior.

Remove the fork and override when upstream ships a verified fix, then rerun
these tests, lint, and both application builds.
