# Recall Strategies Reference

## Search Optimization

### Broad-to-Narrow Search
Start with a broad query, then narrow based on results:
1. `memory_search({ query: "TypeScript", scope: "all" })` — find all TS-related memories
2. `memory_search({ query: "TypeScript testing patterns", scope: "project" })` — narrow to testing
3. Apply the most relevant results

### Category-Filtered Search
When the type of memory is known:
- `category: "preference"` — for user likes/dislikes
- `category: "convention"` — for code patterns
- `category: "pattern"` — for workflow patterns
- `category: "correction"` — for behavioral adjustments
- `category: "workflow"` — for process preferences

### Scope-Aware Search
- Start a new project: search `scope: "user"` for general preferences
- Working on existing project: search `scope: "project"` first, then `scope: "user"` for gaps
- General questions: use `scope: "all"`

## Result Ranking

When multiple memories match, prioritize by:
1. **Importance score** — Higher importance = stronger signal
2. **Recency** — More recent memories may override older ones
3. **Category** — Corrections > Preferences > Conventions > Patterns
4. **Specificity** — More specific memories are more actionable

## Conflict Resolution

When memories conflict:
- Most recent wins (user changed their mind)
- Higher importance wins (explicit > inferred)
- Project scope overrides user scope (for project-specific work)
- Ask the user if truly ambiguous

## Proactive Recall Triggers

Claude should search memories when:
- Starting a coding task (search for relevant conventions)
- Making a style decision (search for preferences)
- Setting up a new file/project (search for workflow patterns)
- About to commit or deploy (search for process preferences)
- Encountering a technology mentioned in memories
