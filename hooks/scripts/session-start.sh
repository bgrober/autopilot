#!/bin/bash
set -euo pipefail

# Autopilot Session Start Hook
# Loads relevant memories and injects them as context for the session.

USER_MEMORY_DIR="$HOME/.claude/memory"
PROJECT_MEMORY_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/memory"

output=""

# Load user-scope patterns (compressed index format)
if [ -d "$USER_MEMORY_DIR/patterns" ]; then
  patterns=""
  for f in "$USER_MEMORY_DIR/patterns"/*.md; do
    [ -f "$f" ] || continue
    # Extract category and first line of content
    category=$(grep -m1 "^category:" "$f" 2>/dev/null | sed 's/category: *//' || echo "general")
    summary=$(grep -m1 "^## " "$f" 2>/dev/null | sed 's/^## //' || head -3 "$f" | tail -1)
    if [ -n "$summary" ]; then
      patterns="${patterns}${category}|${summary}|${f}"$'\n'
    fi
  done
  if [ -n "$patterns" ]; then
    output="${output}"$'\n'"<autopilot-memories scope=\"user\">"$'\n'"## Learned Preferences & Patterns"$'\n'"${patterns}</autopilot-memories>"$'\n'
  fi
fi

# Load project-scope conventions
if [ -d "$PROJECT_MEMORY_DIR/conventions" ]; then
  conventions=""
  for f in "$PROJECT_MEMORY_DIR/conventions"/*.md; do
    [ -f "$f" ] || continue
    category=$(grep -m1 "^category:" "$f" 2>/dev/null | sed 's/category: *//' || echo "general")
    summary=$(grep -m1 "^## " "$f" 2>/dev/null | sed 's/^## //' || head -3 "$f" | tail -1)
    if [ -n "$summary" ]; then
      conventions="${conventions}${category}|${summary}|${f}"$'\n'
    fi
  done
  if [ -n "$conventions" ]; then
    output="${output}"$'\n'"<autopilot-memories scope=\"project\">"$'\n'"## Project Conventions"$'\n'"${conventions}</autopilot-memories>"$'\n'
  fi
fi

# Load recent session summaries (last 3)
for scope_dir in "$USER_MEMORY_DIR" "$PROJECT_MEMORY_DIR"; do
  if [ -d "$scope_dir/sessions" ]; then
    recent=$(ls -t "$scope_dir/sessions"/*.md 2>/dev/null | head -3)
    if [ -n "$recent" ]; then
      scope_name="user"
      [ "$scope_dir" = "$PROJECT_MEMORY_DIR" ] && scope_name="project"
      sessions=""
      for f in $recent; do
        date_part=$(basename "$f" .md)
        summary=$(head -5 "$f" | grep -v "^---" | grep -v "^$" | head -1)
        if [ -n "$summary" ]; then
          sessions="${sessions}${date_part}|${summary}"$'\n'
        fi
      done
      if [ -n "$sessions" ]; then
        output="${output}"$'\n'"<autopilot-recent-sessions scope=\"${scope_name}\">"$'\n'"${sessions}</autopilot-recent-sessions>"$'\n'
      fi
    fi
  fi
done

if [ -n "$output" ]; then
  # Use jq for safe JSON encoding of the output string
  jq -n --arg msg "$output" '{"systemMessage": $msg}'
fi
