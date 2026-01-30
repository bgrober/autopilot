import { join } from "node:path";
import { homedir } from "node:os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemoryFrontmatter {
  id: string;
  category: string;
  scope: string;
  importance: number;
  tags: string[];
  created_at: string;
}

export interface ParsedMemory {
  frontmatter: MemoryFrontmatter;
  content: string;
}

// ---------------------------------------------------------------------------
// Scope directories
// ---------------------------------------------------------------------------

/** ~/.claude/ */
export function userScopeDir(): string {
  return join(homedir(), ".claude");
}

/** .claude/ relative to project root (prefers CLAUDE_PROJECT_DIR env var) */
export function projectScopeDir(cwd?: string): string {
  return join(cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), ".claude");
}

export function memoryScopeDir(
  scope: "user" | "project",
  cwd?: string,
): string {
  const base = scope === "user" ? userScopeDir() : projectScopeDir(cwd);
  return join(base, "memory");
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

/**
 * Generate a URL-safe slug from arbitrary text.
 * Keeps alphanumeric + hyphens, truncates to 60 chars, appends 8-char id suffix
 * to avoid collisions.
 */
export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = crypto.randomUUID().slice(0, 8);
  return base ? `${base}-${suffix}` : suffix;
}

// ---------------------------------------------------------------------------
// Write a memory as a markdown file
// ---------------------------------------------------------------------------

export async function writeMemoryFile(
  memory: MemoryFrontmatter & { content: string },
  cwd?: string,
): Promise<string> {
  const dir = join(
    memoryScopeDir(memory.scope as "user" | "project", cwd),
    memory.category,
  );

  // Ensure directory exists
  const { mkdir } = await import("node:fs/promises");
  await mkdir(dir, { recursive: true });

  const slug = slugify(memory.content);
  const filePath = join(dir, `${slug}.md`);

  const yamlEscape = (s: string): string =>
    /[:#"'\[\]{},|>&*!?@`]/.test(s) ? `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : s;

  const frontmatter = [
    "---",
    `id: ${yamlEscape(memory.id)}`,
    `category: ${yamlEscape(memory.category)}`,
    `scope: ${yamlEscape(memory.scope)}`,
    `importance: ${memory.importance}`,
    `tags: [${memory.tags.map((t) => `"${t.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(", ")}]`,
    `created_at: "${memory.created_at}"`,
    "---",
  ].join("\n");

  const fileContent = `${frontmatter}\n\n${memory.content}\n`;
  await Bun.write(filePath, fileContent);
  return filePath;
}

// ---------------------------------------------------------------------------
// Delete a markdown memory file by ID
// ---------------------------------------------------------------------------

export async function deleteMemoryFileById(
  id: string,
  scope: "user" | "project",
  cwd?: string,
): Promise<boolean> {
  const dir = memoryScopeDir(scope, cwd);
  try {
    const glob = new Bun.Glob("**/*.md");
    for await (const path of glob.scan({ cwd: dir, absolute: true })) {
      try {
        const raw = await Bun.file(path).text();
        // Quick check before full parse
        if (!raw.includes(`id: ${id}`)) continue;
        const parsed = parseMemoryFile(raw);
        if (parsed && parsed.frontmatter.id === id) {
          const { unlink } = await import("node:fs/promises");
          await unlink(path);
          return true;
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return false;
}

// ---------------------------------------------------------------------------
// Parse a markdown memory file
// ---------------------------------------------------------------------------

export function parseMemoryFile(raw: string): ParsedMemory | null {
  const fmRegex = /^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/;
  const match = raw.match(fmRegex);
  if (!match) return null;

  const fmBlock = match[1]!;
  const content = match[2]!.trim();

  const fm: Record<string, unknown> = {};
  for (const line of fmBlock.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value: unknown = line.slice(idx + 1).trim();

    // Parse specific types
    if (key === "importance") {
      value = parseFloat(value as string);
    } else if (key === "tags") {
      // Parse [\"a\", \"b\"] format
      const tagStr = (value as string).replace(/^\[|\]$/g, "");
      value = tagStr
        ? tagStr
            .split(",")
            .map((t) => t.trim().replace(/^"|"$/g, ""))
        : [];
    } else if (typeof value === "string") {
      // Strip surrounding quotes
      value = (value as string).replace(/^"|"$/g, "");
    }

    fm[key] = value;
  }

  return {
    frontmatter: {
      id: (fm.id as string) ?? crypto.randomUUID(),
      category: (fm.category as string) ?? "pattern",
      scope: (fm.scope as string) ?? "project",
      importance: (fm.importance as number) ?? 0.5,
      tags: (fm.tags as string[]) ?? [],
      created_at: (fm.created_at as string) ?? new Date().toISOString(),
    },
    content,
  };
}

// ---------------------------------------------------------------------------
// Scan all markdown files in a memory directory
// ---------------------------------------------------------------------------

export async function scanMemoryFiles(
  scope: "user" | "project" | "all",
  cwd?: string,
): Promise<ParsedMemory[]> {
  const dirs: string[] = [];
  if (scope === "user" || scope === "all") {
    dirs.push(memoryScopeDir("user"));
  }
  if (scope === "project" || scope === "all") {
    dirs.push(memoryScopeDir("project", cwd));
  }

  const memories: ParsedMemory[] = [];

  for (const dir of dirs) {
    try {
      const glob = new Bun.Glob("**/*.md");
      for await (const path of glob.scan({ cwd: dir, absolute: true })) {
        try {
          const file = Bun.file(path);
          const raw = await file.text();
          const parsed = parseMemoryFile(raw);
          if (parsed) {
            memories.push(parsed);
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // Directory doesn't exist yet -- that's fine
    }
  }

  return memories;
}
