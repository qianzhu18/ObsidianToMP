# ObsidianToMP v1.0.9

Stabilization release for the final pre-publication smoke blockers.

## Changes
- Fix local-image copy fallback: when no WeChat account or cloud image host is configured, `复制排版` now embeds local images as portable `data:image/...` URLs instead of leaving Obsidian `app://` links in the clipboard.
- Add a clipboard guard that blocks success if unresolved local image URLs remain.
- Apply the same unresolved-local-image guard to the base copy path.
- Fix narrow right-sidebar toolbar layout by using a single-column default panel and wrapping toolbar controls before restoring a two-column layout on wider panes.
- Normalize extension-to-MIME handling so extension values such as `png` correctly become `image/png`.

## Verification
- Built with `npm run build:release`.
- Installed `v1.0.9` into local `测试` vault and `自媒体` vault.
- Reopened `AI_SELF_TEST/图片文章.md` in the Obsidian `测试` vault.
- Confirmed the narrow publishing workbench shows all toolbar controls without clipping.
- Confirmed a runtime clipboard pass no longer contained `app://`, `file://`, `obsidian://`, `resource://`, or `http://localhost` image URLs and embedded the local image as a data URL.
- Verified `release/v1.0.9/obsidian-to-mp-v1.0.9.zip` with `unzip -t`.

## Notes
- This release fixes GitHub issues #24 and #25.
- The real WeChat draft-save flow should still be verified once with a live official account before public launch.
