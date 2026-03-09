# ObsidianToMP Next Tasks

Updated at: 2026-03-09 (Asia/Shanghai)

## Current status summary
- User-visible blocker still exists: BRAT can register plugin, but Obsidian still reports "插件加载失败".
- Startup hardening patch prepared in this round:
  - lazy-load runtime modules in `plugin/src/main.ts` (note-preview / setting-tab / note-pub / assets / styles)
  - provide fallback preview view instead of hard crash when preview module fails
  - keep plugin boot alive and show explicit Notice messages on module-load failures
- Version bumped locally to `1.0.2` in:
  - `plugin/manifest.json`
  - `plugin/package.json`
  - `plugin/versions.json`

## Completed in this round
1. Implemented safe-boot architecture in `plugin/src/main.ts` to reduce startup hard-crash surface.
2. Rebuilt distributable assets (`main.js`, `styles.css`) from current source.
3. Prepared `v1.0.2` version metadata for release and BRAT upgrade path.
4. Updated acceptance criteria and expected test outcomes for the current blocker.

## Pending tasks (must complete before public rollout)
1. Merge current safe-boot patch to GitHub `main`.
2. Publish release `v1.0.2` with assets:
   - `main.js`
   - `styles.css`
   - `manifest.json`
   - `obsidian-to-mp-v1.0.2.zip`
   - `assets.zip`
3. Reinstall plugin via BRAT and ensure install version resolves to `v1.0.2`.
4. Run GUI validation and collect console logs from Obsidian.
5. If still failing, capture first red stack trace and patch exact failing module in next hotfix.

## Required acceptance results
1. Obsidian no longer shows toast: `"obsidian-to-mp" 插件加载失败。`
2. Plugin appears enabled and setting page can be opened.
3. Running command `复制到公众号` opens right-side preview panel.
4. In case preview module fails, fallback panel appears with explicit error text (no plugin crash).
5. BRAT "Change plugin version" includes `v1.0.2` and can switch to it.

## Risk notes
- There are existing uncommitted local changes in:
  - `plugin/src/article-render.ts`
  - `plugin/src/image-host.ts`
  - `plugin/src/markdown/local-file.ts`
  Release merge should avoid accidentally mixing unrelated local edits.
