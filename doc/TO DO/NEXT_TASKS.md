# ObsidianToMP Next Tasks

Updated at: 2026-03-09 (Asia/Shanghai)

## Current status summary
- Root cause candidate for "插件加载失败": runtime-incompatible PostCSS import was loaded at module init time.
- Hotfix landed locally: lazy-load PostCSS in `plugin/src/utils.ts` with fallback handling.
- Version bumped locally to `1.0.1` in:
  - `plugin/manifest.json`
  - `plugin/package.json`
  - `plugin/versions.json`

## Completed in this round
1. Synced remote refs and verified branch state.
2. Implemented startup-safety fix for PostCSS loading path.
3. Rebuilt plugin bundle successfully.
4. Added structured test report under `doc/TO DO/TEST_REPORT_2026-03-09.md`.

## Pending tasks (must complete before public rollout)
1. Commit and push current hotfix branch.
2. Merge hotfix into `main`.
3. Publish `v1.0.1` release assets (`main.js`, `styles.css`, `manifest.json`, and `assets.zip` if needed).
4. Reinstall via BRAT and verify no "插件加载失败" on fresh vault.
5. Validate desktop and mobile behavior separately:
   - Desktop: copy/paste + draft publish flow.
   - Mobile: plugin loads, settings panel opens, no startup crash.
6. Update top-level README release section to reflect `v1.0.1`.

## Risk notes
- `main` branch local pointer is behind `origin/main` in this workspace; sync before release operations.
- There are existing uncommitted local changes in:
  - `plugin/src/article-render.ts`
  - `plugin/src/image-host.ts`
  - `plugin/src/markdown/local-file.ts`
  Release merge should avoid accidentally mixing unrelated local edits.
