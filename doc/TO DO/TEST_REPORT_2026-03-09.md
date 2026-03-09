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
   - Replaced eager `postcss` import with lazy runtime loading.
   - Added fallback error handling in `applyCSS`.
2. Version metadata bump to `1.0.1`
   - `plugin/manifest.json`
   - `plugin/package.json`
   - `plugin/versions.json`

## Executed tests

### T1. TypeScript + bundle build (workspace)
- Command:
  - `cd plugin && npm run build`
- Result: PASS
- Evidence:
  - Build completed and emitted `Copied main.css → styles.css`

### T2. Lockfile consistency + rebuild
- Command:
  - `cd plugin && npm install --package-lock-only && npm run build`
- Result: PASS
- Evidence:
  - No dependency resolution error
  - Build completed successfully

### T3. Clean-room npm install/build
- Command:
  - Copy plugin folder to temp dir (without `node_modules`)
  - `npm ci --no-audit --no-fund`
  - `npm run build`
- Result: PASS
- Evidence:
  - Build completed and emitted `Copied main.css → styles.css`

### T4. Bundle startup-risk static check
- Check:
  - Verify PostCSS loader is no longer executed at module top-level.
- Result: PASS
- Evidence:
  - `plugin/main.js` contains `require_postcss()` only inside `getPostcss()`.
  - No eager top-level execution path observed for PostCSS runtime module.

### T5. Branch sync verification
- Command:
  - `git rev-list --left-right --count main...origin/main`
- Result: INFO
- Evidence:
  - Output: `0 7` (local `main` is behind remote by 7 commits in this workspace)

## Known gaps
1. No in-app Obsidian GUI runtime test was executed in this terminal session.
2. BRAT reinstall test on a fresh vault still needs manual validation after pushing/merging hotfix.
3. Mobile runtime needs explicit smoke test on iOS/Android device.

## Conclusion
- The hotfix compiles, bundles, and passes clean npm install/build checks.
- The most likely startup crash trigger (eager PostCSS runtime import) has been removed.
- Next mandatory step is BRAT reinstall validation from merged `main` and published `v1.0.1`.
