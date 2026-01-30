---
name: memory-capture
description: This skill should be used when the user says "remember this", "learn this", "save this preference", "store this convention", "don't forget", "always do X", "never do Y", "update my preferences", or "add to memory". It also activates when a clear user preference, correction, or workflow pattern is detected that should be persisted across sessions.
version: 0.1.0
---

# Memory Capture

Identify, categorize, and store learnings from user interactions into the autopilot memory system. Learnings are stored at two scopes (user and project) and flow into CLAUDE.md for passive context availability.

## Categories

| Category | What to capture | Importance |
|----------|----------------|------------|
| `preference` | Explicit likes/dislikes, style choices, tool preferences | 0.9 |
| `convention` | Code patterns, naming rules, architecture decisions | 0.8 |
| `pattern` | Repeated workflows, common request sequences | 0.7 |
| `correction` | User corrections to Claude's behavior or output | 0.9 |
| `workflow` | Process preferences, review steps, deployment habits | 0.7 |

## Capture Process

### 1. Identify the Learning

Look for these signals in the conversation:

**Explicit signals** (importance: 0.9):
- "I prefer...", "Always use...", "Never do...", "Don't..."
- "Remember that...", "From now on...", "Going forward..."
- Direct corrections: "No, do it this way", "Actually..."

**Implicit signals** (importance: 0.7):
- User repeatedly asks for the same thing
- User consistently chooses one approach over another
- User's code follows a pattern not yet documented

**One-time observations** (importance: 0.5):
- Project-specific decisions that might recur
- Tool choices for specific tasks
- Error handling preferences

### 2. Determine Scope

| Scope | Store when | Example |
|-------|-----------|---------|
| `user` | Preference applies across all projects | "I prefer Bun over NPM" |
| `project` | Preference is project-specific | "This project uses Supabase RLS" |

When unclear, default to `user` scope — it's easier to narrow later than to miss a preference.

### 3. Store the Memory

Use the `autopilot-memory` MCP tool `memory_store`:

```
memory_store({
  content: "Clear, actionable description of the learning",
  category: "preference",
  scope: "user",
  importance: 0.9,
  tags: ["relevant", "tags"]
})
```

**Content writing guidelines:**
- Write in imperative form: "Use Bun instead of NPM" not "The user prefers Bun"
- Be specific: "Use conventional commit style: type: short description" not "Use good commit messages"
- Include context: "For iOS projects, use Swift Testing framework (not XCTest)" not "Use Swift Testing"
- Keep under 200 characters for the core learning

### 4. Acknowledge (When Explicit)

When the user explicitly asks to remember something, confirm briefly:

> "Stored: [summary of what was learned]. This will be available in future sessions."

When capturing implicitly (from patterns/corrections), stay silent — don't interrupt workflow.

## CLAUDE.md Integration

After storing a memory with importance ≥0.8, consider integrating it into CLAUDE.md for passive context availability. Run `/autopilot:evolve` to batch-analyze memories and apply structural CLAUDE.md updates using the pipe-delimited compression format:

```
## Autopilot | Learned Preferences
topic|summary|detail-file-path
```

## Deduplication

Before storing, the MCP server checks for existing memories with >0.92 similarity. If a near-duplicate exists:
- If the new memory adds information, update the existing one
- If it's truly duplicate, skip storage
- If it contradicts an existing memory, store with higher importance (the user changed their mind)

## Additional Resources

### Reference Files

For detailed capture patterns and edge cases:
- **`references/capture-patterns.md`** — Common capture scenarios with examples
