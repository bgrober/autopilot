import { connect, type Connection, type Table } from "@lancedb/lancedb";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import {
  generateEmbedding,
  generateEmbeddings,
} from "./embeddings.ts";
import {
  userScopeDir,
  projectScopeDir,
  scanMemoryFiles,
  deleteMemoryFileById,
} from "./markdown.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemoryRecord {
  id: string;
  content: string;
  category: string;
  scope: string;
  importance: number;
  tags: string;       // stored as JSON string for LanceDB compatibility
  created_at: string;
  embedding: number[];
}

export interface MemorySearchResult {
  id: string;
  content: string;
  category: string;
  scope: string;
  importance: number;
  similarity_score: number;
  created_at: string;
  tags: string[];
}

export interface MemoryStats {
  total: number;
  by_category: Record<string, number>;
  by_scope: Record<string, number>;
  most_recent: Array<{
    content: string;
    category: string;
    scope: string;
    created_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// DB path helpers
// ---------------------------------------------------------------------------

function userDbPath(): string {
  return join(userScopeDir(), "memory", ".vectordb");
}

function projectDbPath(cwd?: string): string {
  return join(projectScopeDir(cwd), "memory", ".vectordb");
}

// ---------------------------------------------------------------------------
// Connection cache
// ---------------------------------------------------------------------------

const TABLE_NAME = "memories";

interface DbHandle {
  conn: Connection;
  table: Table | null;
}

const connectionCache = new Map<string, DbHandle>();

async function getConnection(dbPath: string): Promise<DbHandle> {
  let handle = connectionCache.get(dbPath);
  if (handle) return handle;

  await mkdir(dbPath, { recursive: true });
  const conn = await connect(dbPath);

  handle = { conn, table: null };
  connectionCache.set(dbPath, handle);
  return handle;
}

async function getTable(dbPath: string): Promise<Table | null> {
  const handle = await getConnection(dbPath);
  if (handle.table) return handle.table;

  try {
    const names = await handle.conn.tableNames();
    if (names.includes(TABLE_NAME)) {
      handle.table = await handle.conn.openTable(TABLE_NAME);
      return handle.table;
    }
  } catch {
    // Table doesn't exist yet
  }

  return null;
}

async function getOrCreateTable(
  dbPath: string,
  initialData: MemoryRecord[],
): Promise<Table> {
  const existing = await getTable(dbPath);
  if (existing) return existing;

  const handle = await getConnection(dbPath);
  const table = await handle.conn.createTable(
    TABLE_NAME,
    initialData as unknown as Record<string, unknown>[],
    {
      mode: "create",
      existOk: true,
    },
  );
  handle.table = table;
  return table;
}

// ---------------------------------------------------------------------------
// Resolve which DB paths to use for a given scope
// ---------------------------------------------------------------------------

function dbPathsForScope(
  scope: "user" | "project" | "all",
  cwd?: string,
): string[] {
  const paths: string[] = [];
  if (scope === "user" || scope === "all") paths.push(userDbPath());
  if (scope === "project" || scope === "all") paths.push(projectDbPath(cwd));
  return paths;
}

function primaryDbPath(scope: "user" | "project", cwd?: string): string {
  return scope === "user" ? userDbPath() : projectDbPath(cwd);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search memories using vector similarity. Also applies keyword filtering
 * and optional category filter for hybrid search.
 */
export async function searchMemories(opts: {
  query: string;
  scope: "user" | "project" | "all";
  limit: number;
  category?: string;
  cwd?: string;
}): Promise<MemorySearchResult[]> {
  const { query, scope, limit, category, cwd } = opts;
  const paths = dbPathsForScope(scope, cwd);
  const queryEmbedding = await generateEmbedding(query);
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const allResults: MemorySearchResult[] = [];

  for (const dbPath of paths) {
    const table = await getTable(dbPath);
    if (!table) continue;

    try {
      // Vector search
      let builder = table
        .vectorSearch(queryEmbedding)
        .distanceType("cosine")
        .limit(limit * 3); // over-fetch for hybrid ranking

      if (category) {
        builder = builder.where(`category = '${category}'`);
      }

      const results = await builder.toArray();

      for (const row of results) {
        const distance: number = row._distance ?? 1;
        // LanceDB cosine distance = 1 - similarity
        const similarity = 1 - distance;

        // Keyword boost: add a small bonus for matching keywords
        const contentLower = (row.content as string).toLowerCase();
        const matchedTerms = queryTerms.filter((t) =>
          contentLower.includes(t),
        );
        const keywordBoost = matchedTerms.length * 0.02;

        let tags: string[] = [];
        try {
          tags =
            typeof row.tags === "string"
              ? JSON.parse(row.tags)
              : Array.isArray(row.tags)
                ? row.tags
                : [];
        } catch {
          tags = [];
        }

        allResults.push({
          id: row.id as string,
          content: row.content as string,
          category: row.category as string,
          scope: row.scope as string,
          importance: row.importance as number,
          similarity_score: Math.min(similarity + keywordBoost, 1),
          created_at: row.created_at as string,
          tags,
        });
      }
    } catch {
      // If table has no data or search fails, continue
    }
  }

  // Sort by combined score (similarity * importance weighting)
  allResults.sort((a, b) => {
    const scoreA = a.similarity_score * (0.7 + 0.3 * a.importance);
    const scoreB = b.similarity_score * (0.7 + 0.3 * b.importance);
    return scoreB - scoreA;
  });

  // Deduplicate by content
  const seen = new Set<string>();
  const deduped: MemorySearchResult[] = [];
  for (const r of allResults) {
    if (!seen.has(r.content)) {
      seen.add(r.content);
      deduped.push(r);
    }
    if (deduped.length >= limit) break;
  }

  return deduped;
}

/**
 * Store a new memory. Returns true if stored, false if a duplicate was found.
 */
export async function storeMemory(opts: {
  id: string;
  content: string;
  category: string;
  scope: "user" | "project";
  importance: number;
  tags: string[];
  cwd?: string;
}): Promise<{ stored: boolean; duplicate: boolean }> {
  const { id, content, category, scope, importance, tags, cwd } = opts;
  const dbPath = primaryDbPath(scope, cwd);
  const embedding = await generateEmbedding(content);

  // Check for duplicates
  const table = await getTable(dbPath);
  if (table) {
    try {
      const candidates = await table
        .vectorSearch(embedding)
        .distanceType("cosine")
        .limit(5)
        .toArray();

      for (const candidate of candidates) {
        const distance: number = candidate._distance ?? 1;
        const similarity = 1 - distance;
        if (similarity > 0.92) {
          return { stored: false, duplicate: true };
        }
      }
    } catch {
      // No data yet -- that's fine, proceed to store
    }
  }

  const record: MemoryRecord = {
    id,
    content,
    category,
    scope,
    importance,
    tags: JSON.stringify(tags),
    created_at: new Date().toISOString(),
    embedding,
  };

  if (table) {
    await table.add([record] as unknown as Record<string, unknown>[]);
  } else {
    await getOrCreateTable(dbPath, [record]);
  }

  return { stored: true, duplicate: false };
}

/**
 * Delete specific records by their IDs. Used for rollback on failed writes.
 */
export async function deleteByIds(
  ids: string[],
  scope: "user" | "project",
  cwd?: string,
): Promise<void> {
  const dbPath = primaryDbPath(scope, cwd);
  const table = await getTable(dbPath);
  if (!table) return;

  for (const id of ids) {
    try {
      await table.delete(`id = '${id}'`);
    } catch {
      // Best effort
    }
  }
}

/**
 * Delete memories matching a query.
 */
export async function deleteMemories(opts: {
  query: string;
  scope: "user" | "project";
  confirm: boolean;
  cwd?: string;
}): Promise<{ found: MemorySearchResult[]; deleted: number }> {
  const { query, scope, confirm, cwd } = opts;

  // First search for matching memories
  const found = await searchMemories({
    query,
    scope,
    limit: 20,
    cwd,
  });

  if (!confirm || found.length === 0) {
    return { found, deleted: 0 };
  }

  const dbPath = primaryDbPath(scope, cwd);
  const table = await getTable(dbPath);
  if (!table) return { found, deleted: 0 };

  // Delete matching records by ID (safe — UUIDs contain only hex + hyphens)
  let deleted = 0;
  for (const memory of found) {
    try {
      await table.delete(`id = '${memory.id}'`);
      // Also delete the corresponding markdown file
      await deleteMemoryFileById(
        memory.id,
        scope,
        cwd,
      );
      deleted++;
    } catch {
      // Skip individual delete failures
    }
  }

  return { found, deleted };
}

/**
 * Get statistics about stored memories.
 */
export async function getStats(opts: {
  scope: "user" | "project" | "all";
  cwd?: string;
}): Promise<MemoryStats> {
  const { scope, cwd } = opts;
  const paths = dbPathsForScope(scope, cwd);

  const stats: MemoryStats = {
    total: 0,
    by_category: {},
    by_scope: {},
    most_recent: [],
  };

  const allRows: Array<{
    content: string;
    category: string;
    scope: string;
    created_at: string;
  }> = [];

  for (const dbPath of paths) {
    const table = await getTable(dbPath);
    if (!table) continue;

    try {
      const count = await table.countRows();
      stats.total += count;

      // Fetch all rows for aggregation (fine for memory-sized datasets)
      const rows = await table
        .query()
        .select(["content", "category", "scope", "created_at"])
        .toArray();

      for (const row of rows) {
        const cat = row.category as string;
        const sc = row.scope as string;
        stats.by_category[cat] = (stats.by_category[cat] ?? 0) + 1;
        stats.by_scope[sc] = (stats.by_scope[sc] ?? 0) + 1;

        allRows.push({
          content: row.content as string,
          category: cat,
          scope: sc,
          created_at: row.created_at as string,
        });
      }
    } catch {
      // Table exists but is empty or has issues
    }
  }

  // Sort by created_at descending, take top 10
  allRows.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  stats.most_recent = allRows.slice(0, 10);

  return stats;
}

/**
 * Rebuild the vector index from markdown files on disk.
 */
export async function rebuildIndex(opts: {
  scope: "user" | "project" | "all";
  cwd?: string;
}): Promise<{ indexed: number; scopes: string[] }> {
  const { scope, cwd } = opts;
  const memories = await scanMemoryFiles(scope, cwd);

  if (memories.length === 0) {
    return { indexed: 0, scopes: [] };
  }

  // Group memories by scope
  const byScope = new Map<string, typeof memories>();
  for (const m of memories) {
    const s = m.frontmatter.scope as "user" | "project";
    if (!byScope.has(s)) byScope.set(s, []);
    byScope.get(s)!.push(m);
  }

  const scopesProcessed: string[] = [];
  let totalIndexed = 0;

  for (const [memScope, scopeMemories] of byScope) {
    const dbPath = primaryDbPath(memScope as "user" | "project", cwd);
    await mkdir(dbPath, { recursive: true });

    // Generate embeddings for all memories in this scope
    const texts = scopeMemories.map((m) => m.content);
    const embeddings = await generateEmbeddings(texts);

    const records: MemoryRecord[] = scopeMemories.map((m, i) => ({
      id: m.frontmatter.id,
      content: m.content,
      category: m.frontmatter.category,
      scope: m.frontmatter.scope,
      importance: m.frontmatter.importance,
      tags: JSON.stringify(m.frontmatter.tags),
      created_at: m.frontmatter.created_at,
      embedding: embeddings[i]!,
    }));

    // Drop existing table and recreate
    const handle = await getConnection(dbPath);
    try {
      await handle.conn.dropTable(TABLE_NAME);
    } catch {
      // Table didn't exist
    }
    handle.table = null;

    // Invalidate connection cache entry's table reference
    await getOrCreateTable(dbPath, records);

    totalIndexed += records.length;
    scopesProcessed.push(memScope);
  }

  return { indexed: totalIndexed, scopes: scopesProcessed };
}
