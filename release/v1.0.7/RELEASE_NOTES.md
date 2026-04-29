# ObsidianToMP v1.0.7

Polish release for the publishing workbench.

## Changes
- Renamed the main entry to `ObsidianToMP 发布工作台` and switched the ribbon/view icon to `newspaper` to reduce confusion with NoteToMP.
- Renamed publishing actions to match the actual workflow: `保存草稿`, `复制排版`, and `图片草稿`.
- Clarified that `图片草稿` is for screenshot/poster/quick image drafts, while normal long-form articles should use `保存草稿`.
- Updated README positioning, comparison, installation guide, test checklist, and real usage screenshot.
- Updated the bundled Codex/Claude Code skill handoff copy to use `复制排版` and queued draft saving.

## Verification
- Built with `npm run build:release`.
- Installed into local `自媒体` vault and reloaded ObsidianToMP.
- Confirmed runtime version `1.0.7`, view title `ObsidianToMP 发布工作台`, icon `newspaper`, and buttons `保存草稿 / 复制排版 / 图片草稿`.
- Confirmed previous queued draft test result remains successful in `content/.obsidiantomp/publish-result.json`.

## Manual Install
Unzip `obsidian-to-mp-v1.0.7.zip` into:

```text
<your-vault>/.obsidian/plugins/obsidian-to-mp/
```

Then restart Obsidian or reload the plugin.
