# ObsidianToMP Test Report

Date: 2026-03-10 (Asia/Shanghai)
Scope: fix for startup crash `Attempting to register an existing view type "note-preview"`

## Error under investigation
User provided runtime error:
- `Plugin failure: obsidian-to-mp`
- `Error: Attempting to register an existing view type "note-preview"`
- stack includes:
  - `NoteToMpPlugin.registerView`
  - `NoteToMpPlugin.onload`

## Code changes under test
1. `plugin/src/main.ts`
   - changed view type id to unique value: `obsidian-to-mp-note-preview`
2. `plugin/src/note-preview.ts`
   - changed exported view type id to same unique value
3. Version bump to `1.0.3`
   - `plugin/manifest.json`
   - `plugin/package.json`
   - `plugin/versions.json`
4. Rebuilt outputs
   - `plugin/main.js`
   - `plugin/styles.css`
   - refreshed `plugin/package-lock.json`

## Executed tests

### T1. Dependency metadata sync
- Command:
  - `cd plugin && npm install --package-lock-only`
- Result: PASS

### T2. Build validation
- Command:
  - `cd plugin && npm run build`
- Result: PASS
- Evidence:
  - output includes `Copied main.css → styles.css`

### T3. View type id verification
- Command:
  - `rg -n "obsidian-to-mp-note-preview|note-preview" plugin/src/main.ts plugin/src/note-preview.ts plugin/main.js`
- Result: PASS
- Evidence:
  - source and bundle now use `obsidian-to-mp-note-preview`
  - legacy generic id is no longer used as registered view type

### T4. Release availability check
- Command:
  - `gh release list --repo qianzhu18/ObsidianToMP --limit 5`
- Result: PASS
- Evidence:
  - `v1.0.3` exists and is marked as Latest.

## Test conclusion
- The reported conflict point has a direct targeted fix.
- Build and bundle generation pass with the new unique view type id.
- Release `v1.0.3` is already published.
- Next step is user-side reinstall verification on `v1.0.3`.

## Pending validation (not executed in this terminal)
1. BRAT reinstall on user machine.
2. Obsidian GUI runtime smoke test after enabling plugin.
3. Confirm no startup failure toast and preview command availability.

## Delivery record
1. PR merged: `#15` (view type collision fix).
2. Main branch includes merged commit from PR `#15`.
3. Release published: `https://github.com/qianzhu18/ObsidianToMP/releases/tag/v1.0.3`.

## Pass criteria for closure
1. Plugin loads without `register existing view type` error.
2. Plugin remains enabled after Obsidian restart.
3. Preview and settings are accessible.
