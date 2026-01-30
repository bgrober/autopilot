---
name: evolve
description: Analyze memories and apply structural changes — update CLAUDE.md, create skills
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - mcp__autopilot-memory__memory_search
  - mcp__autopilot-memory__memory_stats
argument-hint: "[optional: 'user' or 'project' scope]"
---

# Evolve — Apply Learnings to CLAUDE.md

Analyze stored memories and apply structural improvements: update CLAUDE.md with learned preferences, and suggest new skills or automations when patterns warrant them.

## Instructions

### Phase 1: Analyze

1. **Gather all memories** using `memory_stats` and `memory_search`:
   - Get stats for the target scope (default: both user and project)
   - Search for high-importance memories (importance >= 0.7)
   - Group by category

2. **Read current CLAUDE.md files**:
   - User scope: `~/.claude/CLAUDE.md`
   - Project scope: `./CLAUDE.md` or `./.claude/CLAUDE.md`
   - Identify existing sections and content

3. **Identify gaps** — memories that aren't yet reflected in CLAUDE.md:
   - Preferences not documented
   - Conventions not captured
   - Workflow patterns not automated

### Phase 2: Plan Changes

4. **Draft CLAUDE.md updates** using the pipe-delimited compression format for new sections:

For user-scope CLAUDE.md (`~/.claude/CLAUDE.md`):
- Integrate learnings into existing sections where they fit naturally
- For example, a preference about Bun goes into "Language & Tool Preferences"
- For learnings that don't fit existing sections, add to a new section

For project-scope CLAUDE.md:
- Add project-specific conventions and patterns
- Use existing section structure where possible

**Integration approach** (user chose "integrate into existing sections"):
- Read the existing CLAUDE.md structure carefully
- Place each learning in the most relevant existing section
- If no section fits, create a new section that fits the document's style
- Never duplicate information already present
- Use the same formatting style as the existing document

5. **Present the planned changes** to the user:

```
## Proposed CLAUDE.md Changes

### ~/.claude/CLAUDE.md (user scope)
- **Section "Language & Tool Preferences"**: Add "Bun over NPM" (already present? skip)
- **New section "Code Style"**: Add early-return preference, indentation preference
- **Section "Workflow"**: Add test-before-commit pattern

### ./CLAUDE.md (project scope)
- **New section "Conventions"**: Add Zod validation, Supabase RLS rules
```

### Phase 3: Apply

6. **Wait for user approval** before making any changes to CLAUDE.md files.

7. **Apply approved changes** using the Edit tool:
   - Make surgical edits to existing sections
   - Add new sections in appropriate locations
   - Preserve all existing content
   - Use the document's existing formatting style

8. **Check for automation opportunities**:
   - If a pattern appears 5+ times → suggest creating a hook
   - If a workflow is multi-step and repeated → suggest creating a command
   - If domain knowledge is extensive → suggest creating a skill
   - Present suggestions but don't auto-create without approval

### Phase 4: Confirm

9. **Show summary** of what was changed:

```
## Evolution Complete

### CLAUDE.md Updates
- ~/.claude/CLAUDE.md: 3 sections updated, 1 section added
- ./CLAUDE.md: 1 section added

### Memories Applied
- 12 memories integrated into CLAUDE.md
- 5 memories already reflected (skipped)
- 2 memories too low importance (deferred)

### Automation Suggestions
- Consider creating a "pre-commit-checks" hook (pattern detected 7 times)
```
