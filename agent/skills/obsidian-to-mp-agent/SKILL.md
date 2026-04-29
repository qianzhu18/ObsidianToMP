---
name: obsidian-to-mp-agent
description: Install, configure, and use ObsidianToMP for WeChat public-account writing. Use when a user wants Codex or Claude Code to set up the Obsidian plugin, create WeChat-ready markdown, preview with themes/devices, upload images, and save to WeChat draft via the ObsidianToMP queue.
---

# ObsidianToMP Agent Skill

## When to use
- Set up ObsidianToMP in a user's Obsidian vault.
- Install or update this skill from the ObsidianToMP GitHub repository.
- Generate a WeChat public-account article into the local Obsidian vault.
- Hand off a finished note through ObsidianToMP for theme rendering, device preview, image hosting, and draft publishing.
- Save a finished note to WeChat draft without manual copy.

## Operating modes
- **Setup**: locate the vault, install/update the plugin, initialize folders, and guide account/image-host configuration.
- **Writing**: create or revise a markdown article in the vault.
- **Preview handoff**: ask the user to inspect mobile/tablet/desktop preview in ObsidianToMP.
- **Queued draft**: write `publish-request.json`, trigger Obsidian CLI, and read `publish-result.json`.
- **Troubleshooting**: explain failures from the result file or plugin notices.

## Required setup inputs
- `vault_path`: absolute path to the Obsidian vault.
- `vault_name`: the vault name used by Obsidian CLI.
- `account`: WeChat public-account name or AppID when publishing.
- Optional `topic`, `target_audience`, `angle`, and `output_file` for writing tasks.

Never print `AppSecret`, S3 secret keys, or other credentials in the chat. If the user wants agent-assisted configuration, write secrets only to local Obsidian plugin settings after explicit permission.

## New-user setup workflow
1. Read the repository README if the user came from GitHub.
2. Confirm the vault path exists and contains `.obsidian/`.
3. Check whether `.obsidian/plugins/obsidian-to-mp/manifest.json` exists.
4. If missing, install from the latest release:
   - download `obsidian-to-mp-v*.zip` from `https://github.com/qianzhu18/ObsidianToMP/releases/latest`
   - unzip `main.js`, `styles.css`, and `manifest.json` into `.obsidian/plugins/obsidian-to-mp/`
5. Ask the user to enable the plugin in Obsidian if it is not already enabled. If editing `.obsidian/community-plugins.json`, preserve all existing plugin IDs and only append `obsidian-to-mp`.
6. Create these folders if missing:
   - `content/inbox`
   - `content/review`
   - `content/publish`
   - `content/.obsidiantomp`
7. Tell the user to open ObsidianToMP settings and fill:
   - WeChat account: `公众号名称|AppID|AppSecret`
   - S3-compatible image host if needed
   - default theme, highlight style, and cover settings
8. Run a small test note before attempting a real publish.

## Output contract
When writing an article, write one markdown file inside the vault, preferably under `content/inbox` or `content/publish`.

Include a concise frontmatter block:
```yaml
---
标题: ""
作者: ""
摘要: ""
公众号: ""
样式: "obsidian-light"
代码高亮: "默认"
封面: ""
---
```

Use this structure:
- Title
- Hook intro, 2-4 lines
- 3-5 sections with practical examples
- Summary checklist

Keep local images as normal markdown image links when the user provides local files. ObsidianToMP will upload them during copy/publish when image hosting is configured.

## Publishing handoff
1. Open the generated note in Obsidian.
2. Use ObsidianToMP preview for mobile/tablet/desktop checks.
3. Confirm theme, code highlight, cover, and image rendering.
4. Delivery options:
   - Click `复制排版`; the plugin uploads local images and keeps online URLs unchanged.
   - Save directly to WeChat draft through the queued draft handoff below.

## Queued draft handoff
When the user asks to save directly to WeChat draft, write this file inside the vault:

```text
content/.obsidiantomp/publish-request.json
```

```json
{
  "note": "<vault-relative-md-path>",
  "account": "<account name or wx appid>",
  "resultPath": "content/.obsidiantomp/publish-result.json",
  "requestId": "<optional task id>"
}
```

Then trigger:

```bash
obsidian vault="<VaultName>" command id="obsidian-to-mp:obsidian-to-mp-publish-queued-draft"
```

Read `content/.obsidiantomp/publish-result.json`.

- Treat `ok: true` as complete.
- If `ok: false`, report `error` directly and suggest the next concrete fix.
- If the result file is absent, check whether Obsidian is running, CLI is enabled, the vault name is correct, and the plugin is enabled.

## Common failures
- `IP 不在白名单`: ask the user to add the current outbound IP in the WeChat public-platform backend.
- `access_token` failure: verify AppID/AppSecret and account format.
- image 403 or ACL failure: run the plugin image-host test, check public-read permissions and Public Base URL.
- missing cover/media: ask the user to configure a valid cover image or WeChat material.
- Obsidian command not found: install or enable Obsidian CLI, then retry the queued command.

## CLI invocation template
```bash
codex run "Use $obsidian-to-mp-agent. Vault path: <absolute-vault-path>. Vault name: <vault-name>. Topic: <topic>. Audience: <audience>. Angle: <angle>. Write the article into content/publish and save it to WeChat draft through ObsidianToMP."
```
