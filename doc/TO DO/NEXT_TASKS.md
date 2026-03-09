# ObsidianToMP Next Tasks

Updated at: 2026-03-09 (Asia/Shanghai)

## Current status summary
- Root cause candidate for "插件加载失败": runtime-incompatible PostCSS import was loaded at module init time.
- Hotfix landed locally: lazy-load PostCSS in `plugin/src/utils.ts` with fallback handling.
- BRAT distribution fix landed: `plugin/main.js` and `plugin/styles.css` are now tracked in `main`.
- Version bumped locally to `1.0.1` in:
  - `plugin/manifest.json`
  - `plugin/package.json`
  - `plugin/versions.json`
- Delivery status:
  - Commit `c85f244` pushed to `codex/agent-exploration`
  - PR `#6` merged to `main`
  - Commit `031bdb6` pushed to `codex/agent-exploration`
  - PR `#8` merged to `main`
  - Commit `2ab954d` pushed to `codex/agent-exploration`
  - PR `#10` merged to `main`
  - Release published: `v1.0.1`

## Completed in this round
1. Synced remote refs and verified branch state.
2. Implemented startup-safety fix for PostCSS loading path.
3. Rebuilt plugin bundle successfully.
4. Added structured test report under `doc/TO DO/TEST_REPORT_2026-03-09.md`.
5. Created PR and merged fix into `main`.
6. Fixed BRAT artifact gap and merged to `main` (`PR #8`).
7. Published GitHub release `v1.0.1` with install assets.

## Pending tasks (must complete before public rollout)
1. Reinstall via BRAT and verify no "插件加载失败" on fresh vault.
2. Validate desktop and mobile behavior separately:
   - Desktop: copy/paste + draft publish flow.
   - Mobile: plugin loads, settings panel opens, no startup crash.
3. Update top-level README release section to reflect `v1.0.1`.

## Risk notes
- There are existing uncommitted local changes in:
  - `plugin/src/article-render.ts`
  - `plugin/src/image-host.ts`
  - `plugin/src/markdown/local-file.ts`
  Release merge should avoid accidentally mixing unrelated local edits.
