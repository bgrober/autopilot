---
name: review
description: Review what autopilot learned during this session
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Task
  - mcp__autopilot-memory__memory_search
  - mcp__autopilot-memory__memory_stats
argument-hint: "[optional: topic to review]"
---

# Session Learning Review

Review and summarize what autopilot has learned during this session or about a specific topic.

## Instructions

1. **Get memory stats** to understand the current state:
   - Use the `memory_stats` MCP tool with scope "all"
   - Note total memories, breakdown by category and scope

2. **If a topic argument was provided**, search for memories on that topic:
   - Use `memory_search` with the topic as query
   - Present findings organized by category

3. **If no argument**, review recent session learnings:
   - Search for memories created today using `memory_search` with a broad query
   - Read recent session files from `~/.claude/memory/sessions/`
   - Summarize what was captured

4. **Present the review** in this format:

```
## Autopilot Session Review

### Stats
- Total memories: X (user: Y, project: Z)
- Captured this session: N new memories

### New Learnings
| Category | Learning | Scope | Importance |
|----------|----------|-------|------------|
| preference | ... | user | 0.9 |
| convention | ... | project | 0.8 |

### Suggestions
- [Any patterns that should be promoted to CLAUDE.md]
- [Any memories that might need updating]
```

5. **Ask if the user wants to**:
   - Evolve CLAUDE.md with these learnings (suggest `/autopilot:evolve`)
   - Delete any incorrect memories
   - Adjust any memory importance levels
