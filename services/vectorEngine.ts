import { CodeChunk } from '../types';

/**
 * Calculates Cosine Similarity between two vectors.
 * Higher value = more similar (1.0 is identical).
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Naive in-memory vector search.
 * Sufficient for small-to-medium repos (up to ~5-10k chunks) in modern browsers.
 */
export class VectorStore {
  private chunks: CodeChunk[] = [];

  constructor() {
    this.chunks = [];
  }

  addChunks(newChunks: CodeChunk[]) {
    this.chunks = [...this.chunks, ...newChunks];
  }

  clear() {
    this.chunks = [];
  }

  get count() {
    return this.chunks.length;
  }

  /**
   * Returns top K chunks most similar to query vector.
   */
  search(queryEmbedding: number[], topK: number = 5): CodeChunk[] {
    const scored = this.chunks.map(chunk => {
      if (!chunk.embedding) return { chunk, score: -1 };
      return {
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(item => item.chunk);
  }
}

export const vectorStore = new VectorStore();