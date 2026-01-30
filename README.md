# autopilot

Self-evolving memory and automation for Claude Code.

Autopilot automatically learns your preferences, patterns, and conventions as you work, then applies them by enriching CLAUDE.md and creating skills — so Claude gets better the more you use it.

## How It Works

```
Session Start → Load relevant memories into context
During Session → Detect patterns, preferences, corrections
Pre-Compaction → Flush important context before summarization
Session End → Analyze session, store learnings, evolve CLAUDE.md
```

### Learning Priority (Vercel agents.md research)

1. **CLAUDE.md enrichment** — passive context, always available (highest impact)
2. **Memory files** — detailed learnings retrievable on demand
3. **LanceDB search** — semantic + keyword hybrid search for deep queries

## Components

| Type | Name | Purpose |
|------|------|---------|
| Hook | memory-loader | Loads relevant memories at session start |
| Hook | pattern-detector | Detects learnable patterns after responses |
| Hook | context-flusher | Saves context before compaction |
| Hook | session-learner | Triggers full session analysis at end |
| Skill | memory-capture | How to identify and store learnings |
| Skill | memory-recall | How to search and apply memories |
| Command | /autopilot:review | Review session learnings |
| Command | /autopilot:recall | Search all memories |
| Command | /autopilot:evolve | Force analysis and apply structural changes |
| Agent | memory-analyst | Analyzes sessions, proposes CLAUDE.md updates |
| MCP | autopilot-memory | LanceDB-powered search, store, index tools |

## Installation

```bash
# Test locally
claude --plugin-dir ~/projects/autopilot

# Or install as a plugin
cp -r ~/projects/autopilot ~/.claude/plugins/autopilot
```

## Storage

```
~/.claude/memory/              # User-scope memories
├── sessions/                  # Session summaries
├── patterns/                  # Preferences and patterns
└── .vectordb/                 # LanceDB index

<project>/.claude/memory/      # Project-scope memories
├── sessions/
├── patterns/
├── conventions/               # Code conventions
└── .vectordb/                 # Project LanceDB index
```

## Settings

Create `~/.claude/autopilot.local.md` to configure:

```yaml
---
capture_sensitivity: medium  # low, medium, high
auto_evolve: true            # auto-update CLAUDE.md
scopes:
  user: true
  project: true
categories:
  preferences: true
  conventions: true
  patterns: true
  corrections: true
---
```

## Requirements

- Bun runtime
- Claude Code with plugin support
