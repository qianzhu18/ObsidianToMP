# ObsidianToMP Test Report

Date: 2026-03-09 (Asia/Shanghai)
Scope: startup-failure hotfix validation for BRAT-installed plugin load issues

## Test environment
- Repository: `qianzhu18/ObsidianToMP`
- Working branch during fix: `codex/agent-exploration`
- Node.js: `v22.16.0`
- npm: `10.9.2`
- OS: macOS (local dev machine)

## Code changes under test
1. `plugin/src/utils.ts`
   - lazy-load PostCSS runtime; avoid eager module-load crash surface.
2. `plugin/src/main.ts`
   - safe-boot startup path with lazy module loading.
   - fallback preview view + explicit Notice diagnostics on module failures.
3. Distribution and versioning
   - tracked BRAT-required files in repo
   - version bump to `1.0.2`
   - release `v1.0.2` assets published

## Executed tests

### T1. TypeScript + bundle build
- Command:
  - `cd plugin && npm run build`
- Result: PASS
- Evidence:
  - Build completed and emitted `Copied main.css → styles.css`.

### T2. Lockfile consistency + rebuild
- Command:
  - `cd plugin && npm install --package-lock-only && npm run build`
- Result: PASS
- Evidence:
  - No dependency resolution error.

### T3. Clean-room build reproducibility check
- Command:
  - clone clean `main` to temp dir
  - `npm ci`
  - `npm run build`
  - compare tracked output drift
- Result: PASS (after fix)
- Evidence:
  - tracked `main.js` aligned to clean-source build in latest merge.

### T4. Startup-risk static scan
- Check:
  - PostCSS runtime no longer eager-loaded at module top-level.
- Result: PASS

### T5. Branch sync verification
- Command:
  - `git rev-list --left-right --count main...origin/main`
- Result: PASS
- Evidence:
  - output `0 0`.

### T6. BRAT distribution file presence on `main`
- Command:
  - `git ls-tree -r --name-only origin/main`
- Result: PASS
- Evidence:
  - `plugin/main.js`, `plugin/styles.css`, `plugin/manifest.json`, `plugin/src/styles.css` all exist on `origin/main`.

### T7. Release availability check (`v1.0.2`)
- Command:
  - `gh release list --repo qianzhu18/ObsidianToMP --limit 10`
  - `gh release view v1.0.2 --repo qianzhu18/ObsidianToMP --json assets,url,publishedAt`
- Result: PASS
- Evidence:
  - `v1.0.2` is Latest release.
  - Assets include `main.js`, `styles.css`, `manifest.json`, `obsidian-to-mp-v1.0.2.zip`, `assets.zip`.

## Known gaps
1. User-side Obsidian GUI runtime still reports load failure; exact stack trace not yet captured.
2. No direct GUI test was executed inside this terminal session.
3. Mobile runtime needs dedicated smoke test on iOS/Android devices.

## Conclusion
- Build, packaging, repository distribution, and release delivery checks all pass.
- Startup path has been hardened and moved to safe-boot model.
- Blocker closure now depends on user-side runtime stack trace capture if failure persists after `v1.0.2` reinstall.

## Delivery record
1. PR `#12` merged: https://github.com/qianzhu18/ObsidianToMP/pull/12
2. `main` updated commit: `ab17bc3`
3. Release `v1.0.2`: https://github.com/qianzhu18/ObsidianToMP/releases/tag/v1.0.2

## Required pass criteria for blocker closure
1. BRAT installs and enables `v1.0.2`.
2. No startup toast `"obsidian-to-mp" 插件加载失败。`.
3. Setting tab opens successfully.
4. Preview command works or fallback view appears (plugin stays loaded).
