# ObsidianToMP v1.0.8

Small rendering hardening release based on the beginner closed-loop test.

## Changes
- Hide common loose metadata headers such as `title:` and `description:` when a beginner test note forgets YAML `---` delimiters.
- Keep standard YAML frontmatter stripping stricter and safer.
- Normalize bare Obsidian callouts like `[!NOTE]` into blockquotes before rendering, so quick test notes still become proper callout blocks.

## Verification
- Built with `npm run build:release`.
- Installed into local `自媒体` vault and reloaded ObsidianToMP.
- Rendered `content/publish/小白闭环测试.md`.
- Confirmed `title:` and `description:` are absent from the rendered preview, `[!NOTE]` is absent, and one `.note-callout` block is present.
- Verified release zips with `unzip -t`.
