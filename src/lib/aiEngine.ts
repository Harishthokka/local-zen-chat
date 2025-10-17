// Local, dependency-free AI engine (no npm models)
// Implements simple hashed n-gram embeddings + cosine similarity for retrieval

interface EmbeddingCache {
  dim: number;
}

let modelCache: EmbeddingCache | null = null;

export class AIEngine {
  private embeddings: Map<string, Float32Array> = new Map();
  private documents: Map<string, string> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    // Initialize embedding settings (no network/models)
    modelCache = { dim: 512 };
    this.isInitialized = true;
  }

  async addDocument(fileName: string, content: string, chunks: string[]) {
    if (!this.isInitialized) await this.initialize();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const key = `${fileName}_chunk_${i}`;
      const emb = this.textToEmbedding(chunk);
      this.embeddings.set(key, emb);
      this.documents.set(key, chunk);
    }
  }

  async query(question: string): Promise<string> {
    if (!this.isInitialized) throw new Error("AI engine not initialized");
    if (this.documents.size === 0) {
      return "Please upload some documents first so I can answer your questions based on their content.";
    }

    const q = this.textToEmbedding(question);
    const scores: Array<{ key: string; score: number }> = [];

    for (const [key, emb] of this.embeddings.entries()) {
      scores.push({ key, score: this.cosineSimilarity(q, emb) });
    }

    scores.sort((a, b) => b.score - a.score);
    const top = scores.slice(0, 3);
    const context = top
      .map((t, idx) => `#${idx + 1} (score ${t.score.toFixed(3)}):\n${this.documents.get(t.key)}`)
      .join("\n\n");

    // Simple extractive response (no generation)
    return `Here are the most relevant excerpts I found:\n\n${context}\n\nTip: Ask follow-up questions to narrow down.`;
  }

  clearDocuments() {
    this.embeddings.clear();
    this.documents.clear();
  }

  getDocumentCount(): number {
    return this.documents.size;
  }

  // ---- Embedding helpers (hashed 3-grams) ----
  private textToEmbedding(text: string): Float32Array {
    const dim = modelCache!.dim;
    const vec = new Float32Array(dim);
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    // 3-gram hashing
    for (let i = 0; i < normalized.length - 2; i++) {
      const tri = normalized.slice(i, i + 3);
      const h = this.hash(tri) % dim;
      vec[h] += 1;
    }
    // L2 normalize
    let norm = 0;
    for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < dim; i++) vec[i] /= norm;
    return vec;
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot; // both vectors are L2-normalized
  }

  private hash(str: string): number {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
  }
}

export const aiEngine = new AIEngine();