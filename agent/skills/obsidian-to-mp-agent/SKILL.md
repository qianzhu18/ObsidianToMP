---
name: obsidian-to-mp-agent
description: Generate WeChat-ready markdown into an Obsidian vault, then hand off to ObsidianToMP for preview, auto image upload on copy, and draft publishing.
---

# ObsidianToMP Agent Skill

## When to use
- You want an agent to write a public-account article into the local Obsidian vault.
- You want a consistent handoff path: `CLI draft -> Obsidian preview -> copy(auto image upload) -> draft publish`.

## Required inputs
- `topic`: article topic
- `target_audience`: intended readers
- `angle`: viewpoint and promise
- `output_file`: absolute markdown file path in the vault

## Output contract
1. Write one markdown file at `output_file`.
2. Include a concise frontmatter block:
```yaml
---
title: ""
theme: "默认"
highlight: "默认"
---
```
3. Structure:
- Title
- Hook intro (2-4 lines)
- 3-5 sections with practical examples
- Summary checklist

## Publishing handoff
1. Open the generated note in Obsidian.
2. Use ObsidianToMP preview for device checks.
3. Click `复制到公众号`; plugin auto-uploads local images and keeps online URLs unchanged.
4. Final delivery:
- Copy to WeChat editor, or
- Sync to WeChat draft directly.

## CLI invocation template
```bash
codex run "Use obsidian-to-mp-agent skill. Topic: <topic>. Audience: <audience>. Angle: <angle>. Output: <absolute-output-file>."
```
