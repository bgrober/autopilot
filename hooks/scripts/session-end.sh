#!/bin/bash
set -euo pipefail

# Autopilot Session End Hook
# Creates a session summary file for future reference.

USER_MEMORY_DIR="$HOME/.claude/memory/sessions"
PROJECT_MEMORY_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/memory/sessions"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M%S)
FILENAME="${DATE}-${TIME}.md"

# Ensure directories exist
mkdir -p "$USER_MEMORY_DIR"

# Read session transcript if available
input=$(cat 2>/dev/null || echo "")
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")

if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
  # Create a minimal session marker — the memory-analyst agent will
  # do the full analysis via /autopilot:review or /autopilot:evolve
  cat > "$USER_MEMORY_DIR/$FILENAME" << EOF
---
date: $DATE
time: $(date +%H:%M:%S)
transcript: $transcript_path
analyzed: false
---

Session ended. Pending analysis by memory-analyst agent.
EOF
fi
