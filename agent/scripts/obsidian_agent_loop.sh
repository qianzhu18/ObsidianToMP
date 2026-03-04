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
  obsidian_agent_loop.sh <vault_name_or_path> <note_path> <content_file> [--reload-plugin]

Example:
  obsidian_agent_loop.sh \
    "测试" \
    "content/inbox/agent-demo.md" \
    "/tmp/agent-demo.md" \
    --reload-plugin
USAGE
  exit 1
fi

VAULT_INPUT="$1"
NOTE_PATH="$2"
CONTENT_FILE="$3"
RELOAD_PLUGIN="${4:-}"

if [[ ! -f "$CONTENT_FILE" ]]; then
  echo "error: content file not found: $CONTENT_FILE"
  exit 1
fi

resolve_vault_name() {
  local input="$1"
  local vault_rows

  if ! vault_rows="$(obsidian vaults verbose 2>/dev/null)"; then
    return 1
  fi

  # Prefer exact vault-name match first.
  while IFS=$'\t' read -r name path; do
    [[ -z "$name" ]] && continue
    if [[ "$name" == "$input" ]]; then
      echo "$name"
      return 0
    fi
  done <<< "$vault_rows"

  # If not an existing path, treat it as vault name directly.
  if [[ ! -d "$input" ]]; then
    echo "$input"
    return 0
  fi

  local input_real
  input_real="$(cd "$input" && pwd -P)"

  while IFS=$'\t' read -r name path; do
    [[ -z "$name" || -z "$path" ]] && continue
    if [[ ! -d "$path" ]]; then
      continue
    fi

    local path_real
    path_real="$(cd "$path" && pwd -P)"
    if [[ "$path_real" == "$input_real" ]]; then
      echo "$name"
      return 0
    fi
  done <<< "$vault_rows"

  return 1
}

if ! VAULT_NAME="$(resolve_vault_name "$VAULT_INPUT")"; then
  echo "error: unable to map vault path to vault name: $VAULT_INPUT"
  echo "hint: run 'obsidian vaults verbose' and pass the vault name instead."
  exit 1
fi

CONTENT="$(cat "$CONTENT_FILE")"

echo "[1/3] creating/updating note..."
obsidian vault="$VAULT_NAME" create path="$NOTE_PATH" content="$CONTENT" open

if [[ "$RELOAD_PLUGIN" == "--reload-plugin" ]]; then
  echo "[2/3] reloading plugin: obsidian-to-mp..."
  obsidian vault="$VAULT_NAME" plugin:reload id=obsidian-to-mp
else
  echo "[2/3] skip plugin reload."
fi

echo "[3/3] discover plugin commands and run preview manually:"
echo "obsidian vault=\"$VAULT_NAME\" commands filter=obsidian-to-mp"
echo "obsidian vault=\"$VAULT_NAME\" command id=\"<actual-command-id>\""
echo ""
echo "next in UI: 复制到公众号（自动处理图片） -> 发草稿"
