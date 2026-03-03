#!/usr/bin/env bash
set -euo pipefail

# Minimal bridge script:
# 1) create/update a note via Obsidian CLI
# 2) optionally reload obsidian-to-mp plugin
# 3) print commands for next manual publish step

if ! command -v obsidian >/dev/null 2>&1; then
  echo "error: obsidian CLI not found. Enable CLI in Obsidian Settings -> General -> Command line interface."
  exit 1
fi

if [[ $# -lt 3 ]]; then
  cat <<'USAGE'
Usage:
  obsidian_agent_loop.sh <vault_path> <note_path> <content_file> [--reload-plugin]

Example:
  obsidian_agent_loop.sh \
    "/Users/mac/Downloads/code/obsidian publish/测试/测试" \
    "content/inbox/agent-demo.md" \
    "/tmp/agent-demo.md" \
    --reload-plugin
USAGE
  exit 1
fi

VAULT_PATH="$1"
NOTE_PATH="$2"
CONTENT_FILE="$3"
RELOAD_PLUGIN="${4:-}"

if [[ ! -f "$CONTENT_FILE" ]]; then
  echo "error: content file not found: $CONTENT_FILE"
  exit 1
fi

CONTENT="$(cat "$CONTENT_FILE")"

echo "[1/3] creating/updating note..."
obsidian vault="$VAULT_PATH" create path="$NOTE_PATH" content="$CONTENT" open

if [[ "$RELOAD_PLUGIN" == "--reload-plugin" ]]; then
  echo "[2/3] reloading plugin: obsidian-to-mp..."
  obsidian vault="$VAULT_PATH" plugin:reload id=obsidian-to-mp
else
  echo "[2/3] skip plugin reload."
fi

echo "[3/3] discover plugin commands and run preview manually:"
echo "obsidian vault=\"$VAULT_PATH\" commands filter=obsidian-to-mp"
echo "obsidian vault=\"$VAULT_PATH\" command id=\"<actual-command-id>\""
echo ""
echo "next in UI: 上传+生成Hosted稿 -> 复制/发草稿"

