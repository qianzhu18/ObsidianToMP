# Stable Integration Report

## Branch strategy
- `main`: imported baseline snapshot
- `stable`: current integration and hardening branch

## Problems addressed in this round

### 1) Frontend rebrand and de-legacy cleanup
- Replaced visible product naming and links from upstream branding to `ObsidianToMP`.
- Updated settings header and help links to:
  - `https://github.com/qianzhu18/ObsidianToMP`
- Updated theme download URL to current repo release path.
- Removed widget command entry from plugin commands to avoid exposing legacy external widget flow.

### 2) Copy/paste reliability and preview fidelity
- Added unified clipboard write helper with fallback chain:
  1. `navigator.clipboard.write` with HTML + plain text
  2. Electron `clipboard.write` fallback
- Applied helper in both WeChat article copy and non-WeChat copy path.
- Hardened code-block rendering for paste targets:
  - force block line rendering per code line
  - force `white-space: pre` on code container/styles
  - preserve empty lines in rendered code blocks

## Main files changed
- `plugin/src/utils.ts`
- `plugin/src/article-render.ts`
- `plugin/src/base-render.ts`
- `plugin/src/markdown/code.ts`
- `plugin/src/default-theme.ts`
- `plugin/src/inline-css.ts`
- `plugin/src/main.ts`
- `plugin/src/setting-tab.ts`
- `plugin/src/ui/components/Wechat.tsx`
- `plugin/src/ui/components/NoteRender.tsx`
- `plugin/src/ui/components/RedBook.tsx`
- `plugin/src/assets.ts`
- `plugin/src/note-preview.ts`
- `plugin/src/widgets-modal.ts`

## Build status
- `plugin/` build passed:
  - `npm run build`

## Next integration targets
- Keep iterating on WeChat paste fidelity for complex list/table/callout edge cases.
- Add a dedicated regression note set (`fixtures/`) for copy/paste validation.
- Optional: split unsupported legacy modules into `plugin/legacy/` to reduce maintenance load.
