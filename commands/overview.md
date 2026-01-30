---
name: overview
description: Get a high-level overview of everything autopilot has memorized and learned
allowed-tools:
  - Read
  - Glob
  - mcp__autopilot-memory__memory_search
  - mcp__autopilot-memory__memory_stats
---

# Memory Overview

Generate a comprehensive overview of everything autopilot has learned — a dashboard of stats plus a knowledge map organized by category and theme.

## Instructions

### Step 1: Gather Stats

Use `memory_stats` with scope "all" to get the full picture: total count, breakdown by category and scope.

### Step 2: Gather All Memories

Search for all memories across every category. Run these searches:

- `memory_search` with query "preferences tools languages style", scope "all", category "preference", limit 100
- `memory_search` with query "conventions patterns naming architecture", scope "all", category "convention", limit 100
- `memory_search` with query "workflow process automation deployment", scope "all", category "workflow", limit 100
- `memory_search` with query "patterns repeated behaviors habits", scope "all", category "pattern", limit 100
- `memory_search` with query "corrections fixes mistakes adjustments", scope "all", category "correction", limit 100

### Step 3: Identify Clusters

For each category that has memories, group the results into **thematic clusters**. Look for natural groupings — memories that share a topic or concern. Give each cluster a short, descriptive name.

Examples of clusters:
- Under Preferences: "Tooling", "Code Style", "UI/Design", "Testing"
- Under Conventions: "Naming", "Architecture", "Git Workflow", "Error Handling"
- Under Patterns: "Session Habits", "Review Patterns", "Debugging Approach"

Each cluster should have 2-6 memories. If a cluster would have only 1 memory, include it as an unclustered item under "Other".

### Step 4: Find Date Range

From the gathered memories, identify the oldest and newest `created_at` dates.

### Step 5: Present the Overview

Format the output as follows:

```
## Memory Dashboard

**Total memories:** N (X user-scope · Y project-scope)
**Tracking since:** <oldest date> · **Latest:** <newest date>

| Category     | User | Project | Total |
|--------------|------|---------|-------|
| Preferences  |    X |       Y |     Z |
| Conventions  |    X |       Y |     Z |
| Patterns     |    X |       Y |     Z |
| Corrections  |    X |       Y |     Z |
| Workflows    |    X |       Y |     Z |

---

## Knowledge Map

### Preferences (N memories)

**Tooling** (X)
- Prefers Bun over NPM for Node.js projects
- Uses Swift 6 with strict concurrency
- ...

**Code Style** (X)
- Conventional commits with short subjects
- ...

### Conventions (N memories)

**Naming** (X)
- ...

[Continue for each category that has memories]

---

### Project-Specific Notes

[If there are project-scope memories, call them out here separately with the project path context, so the user knows which learnings are global vs local]
```

### Formatting Rules

- Skip any category that has zero memories
- Sort categories by total count descending
- Within each category, sort clusters by size descending
- Keep each memory description to one line — summarize if the stored content is long
- Show importance in parentheses only for memories with importance >= 0.9: `(importance: 0.9)`
- Use scope indicators only in the Project-Specific Notes section, not in the main knowledge map
