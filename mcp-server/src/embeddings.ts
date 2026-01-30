import { pipeline } from "@xenova/transformers";

const MODEL_NAME =
  process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pipeline: any = null;

async function getPipeline(): Promise<any> {
  if (!_pipeline) {
    _pipeline = await pipeline("feature-extraction", MODEL_NAME);
  }
  return _pipeline;
}

/**
 * Generate an embedding vector for a single text string.
 * Returns a 384-dimensional float array (for all-MiniLM-L6-v2).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getPipeline();
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });
  // output is a Tensor with .data (Float32Array)
  return Array.from((output as { data: Float32Array }).data);
}

/**
 * Generate embedding vectors for multiple texts.
 * Processes them one at a time to avoid OOM with large batches.
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await generateEmbedding(text));
  }
  return results;
}

/**
 * Compute cosine similarity between two vectors.
 * Assumes vectors are already normalized (which they are from the pipeline).
 * Falls back to full formula if not normalized.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector dimension mismatch: ${a.length} vs ${b.length}`,
    );
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}
