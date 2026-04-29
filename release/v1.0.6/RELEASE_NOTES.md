# ObsidianToMP v1.0.6

## Highlights
- Reworked README positioning for Obsidian-native WeChat publishing, multi-device preview, and Agent handoff.
- Clarified differences from NoteToMP, Raphael Publish, MWeb themes, and local fullchain scripts.
- Fixed the Obsidian CLI command ID in docs: `obsidian-to-mp:obsidian-to-mp-publish-queued-draft`.
- Fixed queued draft result writing when `content/.obsidiantomp` was created outside Obsidian.
- Fixed queued draft publishing settings initialization.
- Added a `running` result state so Codex / Claude Code can see that ObsidianToMP has accepted the task.

## Manual Install
Unzip `obsidian-to-mp-v1.0.6.zip` into:

```text
<Vault>/.obsidian/plugins/obsidian-to-mp
```

Then restart Obsidian and enable `ObsidianToMP`.
