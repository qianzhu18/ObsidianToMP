# ObsidianToMP Next Tasks

Updated at: 2026-03-10 (Asia/Shanghai)

## Current blocker
User-side Obsidian still reports plugin load failure after BRAT install.

Latest captured error:
- `Plugin failure: obsidian-to-mp`
- `Error: Attempting to register an existing view type "note-preview"`
- stack points to `NoteToMpPlugin.registerView` in plugin onload.

## Root cause analysis
- View type id used by plugin was too generic: `note-preview`.
- In user environment this id conflicts with an existing registered view type.
- Conflict occurs before plugin fully initializes, causing startup failure toast.

## Applied fix (prepared in v1.0.3)
1. Change preview view type id to unique namespace:
   - from: `note-preview`
   - to: `obsidian-to-mp-note-preview`
2. Keep safe-boot startup hardening from previous patch.
3. Bump plugin version to `1.0.3`.
4. Rebuild distributables (`main.js`, `styles.css`).

## Pending release tasks
1. Merge v1.0.3 fix commit to GitHub `main`.
2. Publish `v1.0.3` release with assets:
   - `main.js`
   - `styles.css`
   - `manifest.json`
   - `obsidian-to-mp-v1.0.3.zip`
   - `assets.zip`
3. Reinstall via BRAT and confirm version resolves to `v1.0.3`.

## Required acceptance results
1. No toast: `"obsidian-to-mp" 插件加载失败。`
2. Plugin can be enabled and remains enabled after restart.
3. Command `复制到公众号` opens preview panel.
4. Plugin settings page opens successfully.
5. BRAT version selector contains `v1.0.3`.

## Runtime debug requirement (if still failing)
Capture and attach:
1. First red error message in Obsidian Console.
2. Full stack trace.
3. Installed plugin version shown in BRAT.
