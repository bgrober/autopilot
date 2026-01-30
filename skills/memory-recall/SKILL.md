---
name: memory-recall
description: This skill should be used when the user asks "what do you remember", "recall", "search memories", "what have you learned", "what are my preferences", "do you remember", "show me what you know about", or "what conventions does this project use". Also activates when the user asks to "forget this", "remove this memory", "delete this preference", or when stored learnings need to be retrieved to inform a coding task, style decision, or project setup.
version: 0.1.0
---

# Memory Recall

Search and apply stored memories from the autopilot system to inform current work. Memories exist at two scopes (user and project) and are searchable via the autopilot-memory MCP tools.

## When to Recall

### Explicit Recall
The user directly asks about stored memories or knowledge:
- "What do you remember about my preferences?"
- "What conventions does this project follow?"
- "Do you remember how I like commit messages?"

### Implicit Recall
Proactively search memories when:
- Starting work on a task that might have relevant conventions
- Making a decision where user preferences would apply
- Encountering a pattern that seems familiar

## Recall Process

### 1. Search Memories

Use the `autopilot-memory` MCP tool `memory_search`:

```
memory_search({
  query: "descriptive search query",
  scope: "all",    // or "user" / "project"
  limit: 10,
  category: null   // or specific category
})
```

**Search strategies:**
- For preferences: search by topic ("commit messages", "indentation", "testing")
- For conventions: search by technology ("TypeScript", "SwiftUI", "API")
- For patterns: search by workflow ("deployment", "review", "branching")
- For broad recall: use `memory_stats` first to see what's available

### 2. Present Results

**For explicit recall requests**, present memories clearly:

```
Here's what I remember about [topic]:

**Preferences:**
- Use Bun over NPM (importance: 0.9)
- Conventional commit style (importance: 0.9)

**Conventions (this project):**
- Zod validation on all API routes (importance: 0.8)
- Supabase with RLS policies (importance: 0.8)

**Patterns:**
- Run tests before committing (importance: 0.7)
```

**For implicit recall**, apply memories without announcing their source. Do not say "I found a memory that says..." — simply follow the stored preference as if it were built-in knowledge.

### 3. Apply Memories

When memories are relevant to current work:
- Follow preferences without asking (they've been explicitly stored)
- Apply conventions to code being written
- Follow workflow patterns naturally
- If a memory contradicts current instructions, follow the most recent instruction

## Memory Analytics

Use `memory_stats` to provide overview:

```
memory_stats({ scope: "all" })
```

Present as:
```
Autopilot Memory Stats:
- Total memories: 47
- User scope: 32 | Project scope: 15
- By category: preferences (18), conventions (12), patterns (9), corrections (5), workflows (3)
- Most recent: 2026-01-30
```

## Forgetting

When the user wants to remove a memory:

```
memory_forget({
  query: "the preference to forget",
  scope: "user",
  confirm: false  // first search to show what would be deleted
})
```

Show matches first, then confirm before deleting:

```
memory_forget({
  query: "the preference to forget",
  scope: "user",
  confirm: true  // actually delete
})
```

## Additional Resources

### Reference Files

For advanced recall patterns and troubleshooting:
- **`references/recall-strategies.md`** — Search optimization and result ranking
