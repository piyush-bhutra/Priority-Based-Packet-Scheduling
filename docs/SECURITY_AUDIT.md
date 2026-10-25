# Security and repository hygiene audit

Date: 2026-10-25 (Asia/Calcutta). Baseline: `5e7ba73` on `master`.
Scope: minimal ignore-rule cleanup, npm development advisories, credential/history checks and regression
verification. Application features and scheduling code are unchanged. No forced audit fix, dependency
override, major upgrade, history rewrite or push was performed.

## Changes and ignore verification

`.gitignore` now excludes `.env.*`, common private keys/keystores, SSH/AWS credential directories,
credential JSON filenames, local npm/Python authentication files and `venv/`. Deliberate `.env.example`
and `.env.*.example` templates remain trackable at the root and in subdirectories. Templates must contain
placeholders, not real credentials. Lockfiles, verification JSON and report screenshots remain tracked.

Executed 38 `git check-ignore --no-index` behavior checks: all passed. They include protected credential
paths, nested frontend environment files, allowed example templates, existing generated-output rules,
and unignored dependency lockfiles. No tracked file became ignored. Ignore rules prevent accidental
addition; they cannot remove secrets already committed or guarantee that a renamed secret is detected.

## npm findings and available fixes

Fresh full audit: **3 vulnerable development packages — 2 critical, 1 moderate**.
Fresh `npm audit --omit=dev`: **0 known runtime findings**. Package counts include inherited findings;
they are not a count of independent vulnerabilities or demonstrated attacks against this application.

| Installed dependency | npm severity | Evidence and fix |
|---|---|---|
| `tinypool` 1.1.1 | Critical | Worker-option and run-option prototype-pollution gadgets. Both fixes require tinypool >=2.1.2; 2.1.1 fixes only the worker-options finding. |
| `@vitest/mocker` 3.2.7 | Moderate | Redirect-mock file reading and manual-mock code injection. A coherent patched line needs >=4.1.12 or >=5.0.3. |
| `vitest` 3.2.7 | Critical | Inherits critical tinypool and moderate mocker findings; also directly listed for the redirect-mock advisory. npm proposes Vitest 5.0.5, marked a major upgrade. |

Registry metadata confirms Vitest **3.2.7 is the latest 3.x**, and tinypool **1.1.1 is the latest 1.x**.
Vitest 3.2.7 declares `tinypool: ^1.1.1` and exact `@vitest/mocker: 3.2.7`. Patched versions therefore
fall outside those declared ranges. No compatible non-breaking security update was identified.
**No dependency or lockfile change was applied.** Cross-major overrides would bypass the compatibility
contract and are not justified for this minimal cleanup, even if a small test suite happened to pass.

Primary advisory references:

- [Tinypool worker options, GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3)
- [Tinypool run options, GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr)
- [Mock redirect file reading, GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)
- [Manual mock code injection, GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8)

## Exploitability in this repository

This is a configuration/source assessment, not an exploit demonstration:

- `npm test` runs trusted local tests once with `vitest run`; no Vitest browser mode, test API/UI server
  or public mocker/interceptor plugin is configured. The application Vite plugins are React and Tailwind.
  Thus the advisories' unauthenticated mock-registration handler is not enabled in this configuration.
  Browser integration uses separate Playwright/Edge, not Vitest browser mode.
- Tinypool runs behind Vitest and is not used by Flask or the React application. The critical gadgets
  require prior attacker-controlled prototype pollution in the Node test process; the run-options issue
  additionally requires a caller-supplied options object. No application path forwarding packet input
  into that process/options was found. This does not prove the installed dependency can never be exploited.
- Development/preview scripts and the browser tests bind servers to loopback. Do not expose the tooling
  to a LAN/tunnel or run untrusted tests/plugins. Keep credentials out of test environments. Production
  frontend output does not ship the Vitest test runner; runtime-only npm audit is clean at this date.

These conditions reduce the exposed attack surface but do not remove the vulnerable packages or justify
claiming zero vulnerabilities. The npm audit result is unchanged after the hygiene cleanup.

## Recommended future action

In a separately reviewed dependency-maintenance change, evaluate a coherent supported Vitest major
upgrade (npm currently suggests 5.0.5). Check Node/Vite compatibility and migration notes, verify resolved
tinypool >=2.1.2 and mocker on a patched line, then rerun all unit/browser/backend tests, TypeScript,
build and npm audits. Keep the existing checkpoints. Do not use `npm audit fix --force` or mix internal
Vitest package majors to suppress findings. No upgrade compatibility claim is made by this audit.

## Credential and history evidence

Scanned the current 61 tracked files and all three existing commits reachable from Git refs, including
their text contents and sensitive filenames. Known GitHub/OpenAI/AWS token patterns, quoted credential
assignments and PEM/OpenSSH private-key headers produced **zero candidate paths**. No tracked private-key,
credential, environment, node_modules, cache or generated-build paths were found. Matches would have been
reported by filename only; no credential values were printed. Binary image contents were not OCR-scanned.
This bounded scan found no exposed credentials; it is not an exhaustive secret-scanner certification.

## Regression verification and sharing assessment

The cleanup preserves backend/frontend implementation and dependency manifests/lockfile exactly as at
`5e7ba73`. Fresh results: **118 backend tests passed**, **22 frontend unit tests passed**, explicit
TypeScript check and production build exited 0, and **38 ignore checks passed**.

The initial browser run timed out at server startup and diagnostic commands stopped returning output.
Command execution subsequently recovered. A fresh `npm.cmd run test:e2e` completed with **13 passed**;
backend units (**118 passed**) and frontend units (**22 passed**) were rerun for publication as well.
No application/configuration change was made to conceal the earlier failure. The publication production
build also passed, including TypeScript checking. The cleanup is verified for its checkpoint. A bounded publication scan
covered 62 source/documentation files and all three prior commits with zero credential candidates;
19 representative ignore checks also passed.

The repository is suitable for **private teammate source/report sharing**, with the remaining development
advisories disclosed. It is not a zero-vulnerability or security-certified release. The user has now
authorized a GitHub push and origin is configured to the provided repository. Existing implementation
and documentation checkpoints are preserved; remote commit equality must be verified after publication.
