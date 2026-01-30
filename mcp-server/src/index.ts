#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  searchMemories,
  storeMemory,
  deleteMemories,
  getStats,
  rebuildIndex,
} from "./db.ts";
import { writeMemoryFile } from "./markdown.ts";

// ---------------------------------------------------------------------------
// Shared schema values
// ---------------------------------------------------------------------------

const CategoryEnum = z.enum([
  "preference",
  "convention",
  "pattern",
  "correction",
  "workflow",
]);

const ScopeEnum = z.enum(["user", "project"]);
const ScopeWithAllEnum = z.enum(["user", "project", "all"]);

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer(
  {
    name: "autopilot-memory",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ---------------------------------------------------------------------------
// Tool: memory_search
// ---------------------------------------------------------------------------

server.tool(
  "memory_search",
  "Hybrid search across all memories (vector similarity + keyword matching). Use this to find relevant memories, preferences, conventions, and patterns.",
  {
    query: z.string().describe("Search query text"),
    scope: ScopeWithAllEnum
      .default("all")
      .describe("Which memories to search: user-level, project-level, or all"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .describe("Maximum number of results to return"),
    category: CategoryEnum.optional().describe(
      "Filter results to a specific category",
    ),
  },
  async (args) => {
    try {
      const results = await searchMemories({
        query: args.query,
        scope: args.scope,
        limit: args.limit,
        category: args.category,
        cwd: process.cwd(),
      });

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No memories found matching the query.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error searching memories: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool: memory_store
// ---------------------------------------------------------------------------

server.tool(
  "memory_store",
  "Store a new memory with automatic deduplication. Memories are persisted as markdown files and indexed in a vector database for semantic search.",
  {
    content: z.string().describe("The memory content to store"),
    category: CategoryEnum.describe("Category of the memory"),
    scope: ScopeEnum.describe(
      "user = global across all projects, project = specific to current project",
    ),
    importance: z
      .number()
      .min(0)
      .max(1)
      .describe("Importance score from 0 (low) to 1 (critical)"),
    tags: z.array(z.string()).describe("Tags for organizing the memory"),
  },
  async (args) => {
    try {
      const id = crypto.randomUUID();
      const cwd = process.cwd();

      // Store in vector DB (with dedup check)
      const result = await storeMemory({
        id,
        content: args.content,
        category: args.category,
        scope: args.scope,
        importance: args.importance,
        tags: args.tags,
        cwd,
      });

      if (result.duplicate) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Memory not stored: a very similar memory already exists (similarity > 0.92).",
            },
          ],
        };
      }

      // Also write the markdown file
      const filePath = await writeMemoryFile(
        {
          id,
          content: args.content,
          category: args.category,
          scope: args.scope,
          importance: args.importance,
          tags: args.tags,
          created_at: new Date().toISOString(),
        },
        cwd,
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                stored: true,
                id,
                file: filePath,
                category: args.category,
                scope: args.scope,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error storing memory: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool: memory_index
// ---------------------------------------------------------------------------

server.tool(
  "memory_index",
  "Rebuild the vector search index from markdown memory files on disk. Use this after manually editing memory files or to repair a corrupted index.",
  {
    scope: ScopeWithAllEnum
      .default("all")
      .describe("Which scope(s) to re-index"),
  },
  async (args) => {
    try {
      const result = await rebuildIndex({
        scope: args.scope,
        cwd: process.cwd(),
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                indexed: result.indexed,
                scopes: result.scopes,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error rebuilding index: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool: memory_stats
// ---------------------------------------------------------------------------

server.tool(
  "memory_stats",
  "Return analytics about stored memories including counts by category and scope, and the most recent entries.",
  {
    scope: ScopeWithAllEnum
      .default("all")
      .describe("Which scope(s) to include in stats"),
  },
  async (args) => {
    try {
      const stats = await getStats({
        scope: args.scope,
        cwd: process.cwd(),
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting stats: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool: memory_forget
// ---------------------------------------------------------------------------

server.tool(
  "memory_forget",
  "Delete specific memories. First searches for matching memories, then deletes them if confirm is true. Use confirm=false to preview what would be deleted.",
  {
    query: z.string().describe("Search query to find memories to delete"),
    scope: ScopeEnum.describe("Which scope to delete from"),
    confirm: z
      .boolean()
      .describe(
        "Set to true to actually delete. Set to false to preview matches without deleting.",
      ),
  },
  async (args) => {
    try {
      const result = await deleteMemories({
        query: args.query,
        scope: args.scope,
        confirm: args.confirm,
        cwd: process.cwd(),
      });

      if (!args.confirm) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  preview: true,
                  matches: result.found.length,
                  memories: result.found,
                  message:
                    "Set confirm=true to delete these memories.",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                deleted: result.deleted,
                total_matches: result.found.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error deleting memories: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("autopilot-memory MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
