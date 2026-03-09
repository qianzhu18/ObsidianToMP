# ObsidianToMP Next Tasks

Updated at: 2026-03-09 (Asia/Shanghai)

## Current status summary
- User-visible blocker still exists: BRAT can register plugin, but Obsidian still reports "插件加载失败" on user side.
- Safe-boot startup hardening patch is merged to GitHub `main`.
- Release `v1.0.2` is published and marked as Latest.
- BRAT-required distributables are tracked in repo (`plugin/main.js`, `plugin/styles.css`, `plugin/src/styles.css`).

## Delivery status (already done)
1. PR `#12` merged to `main`: startup hardening + `v1.0.2` prep.
2. Release published: `v1.0.2`.
3. Release assets uploaded:
   - `main.js`
   - `styles.css`
   - `manifest.json`
   - `obsidian-to-mp-v1.0.2.zip`
   - `assets.zip`

## Pending tasks (must complete before blocker closure)
1. Reinstall plugin via BRAT and ensure installed version is `v1.0.2`.
2. Run GUI validation in Obsidian and capture console logs.
3. If still failing, capture first red stack trace and patch exact failing module in next hotfix.

## Required acceptance results
1. Obsidian no longer shows toast: `"obsidian-to-mp" 插件加载失败。`
2. Plugin can be enabled and setting page can be opened.
3. Running command `复制到公众号` opens right-side preview panel.
4. If preview submodule fails, fallback view renders with explicit error text (no full plugin crash).
5. BRAT "Change plugin version" includes `v1.0.2` and can switch to it.

## Risk notes
- There are existing uncommitted local changes in:
  - `plugin/src/article-render.ts`
  - `plugin/src/image-host.ts`
  - `plugin/src/markdown/local-file.ts`
- Release merge flow should continue excluding those unrelated local edits.
