---
name: recall
description: Search and retrieve memories from autopilot's memory system
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__autopilot-memory__memory_search
  - mcp__autopilot-memory__memory_stats
  - mcp__autopilot-memory__memory_forget
argument-hint: "<search query>"
---

# Memory Recall

Search the autopilot memory system for stored learnings, preferences, conventions, and patterns.

## Instructions

1. **If a search query was provided**, search all memories:
   - Use `memory_search` with the query, scope "all", limit 20
   - Present results organized by relevance and category

2. **If no query**, show memory overview:
   - Use `memory_stats` for scope "all"
   - List the top 5 most important memories from each scope
   - Show category breakdown

3. **Present results** clearly:

```
## Memory Search: "[query]"

### User Scope
| Category | Learning | Importance |
|----------|----------|------------|
| ... | ... | ... |

### Project Scope
| Category | Learning | Importance |
|----------|----------|------------|
| ... | ... | ... |
```

4. **If the user wants to modify memories**:
   - To delete: Use `memory_forget` with confirm=false first to preview, then confirm=true
   - To update: Delete the old memory, store a new one with corrected content
   - Guide the user through the process

5. **If the user wants to read full details**, read the referenced markdown memory files.
