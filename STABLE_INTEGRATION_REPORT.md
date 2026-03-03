# Stable Integration Report

## Branch strategy
- `main`: imported baseline snapshot
- `stable`: current integration and hardening branch

## This round focus (2026-03-04)
1. Copy/paste reliability and template fidelity
2. Cloud image hosting for local-image workflow
3. Open-source project polish (README + project records)

## Key improvements

### A. Copy/paste reliability
- Added unified clipboard writer with fallback chain:
  1. `navigator.clipboard.write` (HTML + plain text)
  2. Electron `clipboard.write`
- Applied to WeChat article copy and non-WeChat copy path.

### B. Template copy fidelity
- Added paste normalization step for generated HTML:
  - enforce `pre/code` whitespace behavior
  - enforce ordered/unordered list marker styles
  - enforce list item display semantics
- Improved code block generation to preserve line-by-line structure and empty lines.

### C. Cloud image host (S3-compatible)
- Added configurable S3-compatible image host module.
- Added plugin settings for endpoint/bucket/region/key/public URL/path prefix.
- Added “test upload” button in settings.
- Added WeChat panel action: `上传图片到云端`.
- Added auto-upload-on-copy fallback when no WeChat account selected.

## Main files changed in this round
- `plugin/src/settings.ts`
- `plugin/src/image-host.ts` (new)
- `plugin/src/markdown/local-file.ts`
- `plugin/src/article-render.ts`
- `plugin/src/utils.ts`
- `plugin/src/setting-tab.ts`
- `plugin/src/ui/components/Wechat.tsx`
- `plugin/src/markdown/code.ts`
- `plugin/src/default-theme.ts`
- `plugin/src/inline-css.ts`
- `plugin/README.md`
- `README.md`
- `project record/2026-03-04-requirements.md`

## Build verification
- `cd plugin && npm install && npm run build` passed.

## Remaining risks
- Complex table/callout/list edge cases in WeChat editor still require iterative fixture-based testing.
- S3-compatible providers with non-standard signature behavior may require provider-specific tweaks.

## Next actions
1. Add regression fixture notes for copy fidelity.
2. Add upload error classification and troubleshooting hints.
3. Prepare first public release notes and demo assets.
