# Capture Patterns Reference

Detailed examples of memory capture scenarios organized by category.

## Preference Captures

### Explicit Preferences
```
User: "I always want you to use Bun instead of NPM"
→ memory_store({
    content: "Use Bun as package manager instead of NPM for all Node.js projects",
    category: "preference",
    scope: "user",
    importance: 0.9,
    tags: ["tooling", "package-manager", "bun"]
  })
```

### Style Preferences
```
User: "Don't use emojis unless I ask for them"
→ memory_store({
    content: "Do not use emojis in output unless explicitly requested",
    category: "preference",
    scope: "user",
    importance: 0.9,
    tags: ["output-style", "formatting"]
  })
```

### Tool Preferences
```
User: "For testing, use swift-testing not XCTest"
→ memory_store({
    content: "Use Swift Testing framework instead of XCTest for iOS test code",
    category: "preference",
    scope: "user",
    importance: 0.9,
    tags: ["testing", "swift", "ios"]
  })
```

## Convention Captures

### Naming Conventions
```
User consistently names files in kebab-case across 3+ sessions
→ memory_store({
    content: "Use kebab-case for file naming: my-component.tsx, user-service.ts",
    category: "convention",
    scope: "project",
    importance: 0.8,
    tags: ["naming", "files"]
  })
```

### Architecture Patterns
```
User: "All API routes should use Zod validation"
→ memory_store({
    content: "Validate all API route inputs using Zod schemas before processing",
    category: "convention",
    scope: "project",
    importance: 0.8,
    tags: ["api", "validation", "zod"]
  })
```

### Code Style
```
User always writes early returns instead of nested ifs
→ memory_store({
    content: "Prefer early returns over nested if/else blocks for guard clauses",
    category: "convention",
    scope: "user",
    importance: 0.7,
    tags: ["code-style", "readability"]
  })
```

## Correction Captures

### Behavioral Corrections
```
User: "No, don't create a new file for that. Just add it to the existing one."
→ memory_store({
    content: "Prefer editing existing files over creating new ones. Only create new files when explicitly needed.",
    category: "correction",
    scope: "user",
    importance: 0.9,
    tags: ["workflow", "files"]
  })
```

### Output Corrections
```
User: "That's too verbose. Keep it shorter."
→ memory_store({
    content: "Keep responses concise and focused. Avoid unnecessary verbosity.",
    category: "correction",
    scope: "user",
    importance: 0.9,
    tags: ["output-style", "brevity"]
  })
```

## Pattern Captures

### Repeated Requests
```
User asks to run tests before committing in 3+ sessions
→ memory_store({
    content: "Always run tests before committing code changes",
    category: "pattern",
    scope: "user",
    importance: 0.7,
    tags: ["workflow", "testing", "git"]
  })
```

### Workflow Sequences
```
User consistently follows: implement → test → review → commit
→ memory_store({
    content: "Development workflow: implement feature → run tests → review code → commit",
    category: "workflow",
    scope: "user",
    importance: 0.7,
    tags: ["workflow", "development-cycle"]
  })
```

## Workflow Captures

### Process Preferences
```
User: "Always use the brainstorming skill before implementing features"
→ memory_store({
    content: "Use brainstorming skill before implementing any medium or large feature",
    category: "workflow",
    scope: "user",
    importance: 0.8,
    tags: ["workflow", "planning", "skills"]
  })
```

### Environment Preferences
```
User always deploys to Vercel for web projects
→ memory_store({
    content: "Deploy web projects to Vercel. Use vercel:deploy skill for deployment.",
    category: "workflow",
    scope: "user",
    importance: 0.7,
    tags: ["deployment", "vercel"]
  })
```

## Edge Cases

### Contradicting Previous Memory
When a user changes their mind, store the new preference with high importance:
```
Previous: "Use tabs for indentation"
User now: "Actually, switch to 2-space indentation"
→ memory_store({
    content: "Use 2-space indentation (changed from tabs)",
    category: "preference",
    scope: "user",
    importance: 0.95,
    tags: ["code-style", "indentation"]
  })
```

### Temporary vs Permanent
Some preferences are project-specific and temporary:
```
User: "For this project, use PostgreSQL"
→ Store with scope: "project", not "user"

User: "I'm trying out Tailwind CSS for this"
→ Store with scope: "project", importance: 0.5 (experimental)
```

### Ambiguous Scope
When it's unclear whether a preference is user-wide or project-specific:
- Default to `user` scope
- If the preference mentions "this project", "this repo", or "here", use `project`
- If it's about a specific technology tied to the project, use `project`
