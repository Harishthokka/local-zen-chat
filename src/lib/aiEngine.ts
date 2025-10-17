import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js for browser use
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

interface EmbeddingCache {
  embedder: any;
  generator: any;
}

let modelCache: EmbeddingCache | null = null;

export class AIEngine {
  private embeddings: Map<string, number[]> = new Map();
  private documents: Map<string, string> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log("Initializing AI models... This may take a minute.");
      
      // Try WebGPU first, fallback to WASM (CPU)
      const device = "wasm" as const;
      
      // Initialize embedding model (small and fast)
      if (!modelCache?.embedder) {
        console.log("Loading embedding model...");
        modelCache = {
          embedder: await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2",
            { 
              device,
              progress_callback: (progress: any) => {
                if (progress.status === 'downloading') {
                  console.log(`Downloading: ${progress.name} - ${Math.round(progress.progress || 0)}%`);
                }
              }
            }
          ),
          generator: null
        };
        console.log("Embedding model loaded successfully");
      }
      
      // Initialize text generation model (small for offline use)
      if (!modelCache?.generator) {
        console.log("Loading text generation model...");
        modelCache.generator = await pipeline(
          "text2text-generation",
          "Xenova/flan-t5-small",
          { 
            device,
            progress_callback: (progress: any) => {
              if (progress.status === 'downloading') {
                console.log(`Downloading: ${progress.name} - ${Math.round(progress.progress || 0)}%`);
              }
            }
          }
        );
        console.log("Text generation model loaded successfully");
      }
      
      this.isInitialized = true;
      console.log("✅ All AI models initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing AI models:", error);
      throw new Error(`Failed to initialize AI models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addDocument(fileName: string, content: string, chunks: string[]) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`Processing ${chunks.length} chunks from ${fileName}...`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const key = `${fileName}_chunk_${i}`;
      
      try {
        // Generate embedding for the chunk
        const output = await modelCache!.embedder(chunk, {
          pooling: "mean",
          normalize: true,
        });
        
        const embedding = Array.from(output.data) as number[];
        this.embeddings.set(key, embedding);
        this.documents.set(key, chunk);
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
      }
    }
    
    console.log(`Processed ${fileName}: ${this.documents.size} total chunks indexed`);
  }

  async query(question: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error("AI engine not initialized");
    }

    if (this.documents.size === 0) {
      return "Please upload some documents first so I can answer your questions based on their content.";
    }

    try {
      console.log("Generating query embedding...");
      
      // Generate embedding for the question
      const queryOutput = await modelCache!.embedder(question, {
        pooling: "mean",
        normalize: true,
      });
      const queryEmbedding = Array.from(queryOutput.data) as number[];

      // Find most relevant chunks using cosine similarity
      const similarities: Array<{ key: string; score: number }> = [];
      
      for (const [key, embedding] of this.embeddings.entries()) {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        similarities.push({ key, score: similarity });
      }

      // Sort by similarity and get top 3 chunks
      similarities.sort((a, b) => b.score - a.score);
      const topChunks = similarities.slice(0, 3);
      
      console.log("Top matching chunks:", topChunks);

      // Build context from top chunks
      const context = topChunks
        .map((item) => this.documents.get(item.key))
        .filter(Boolean)
        .join("\n\n");

      // Generate answer using context
      const prompt = `Context: ${context}\n\nQuestion: ${question}\n\nAnswer:`;
      
      console.log("Generating answer...");
      const result = await modelCache!.generator(prompt, {
        max_length: 200,
        temperature: 0.7,
      });

      return result[0].generated_text || "I couldn't generate an answer based on the documents.";
    } catch (error) {
      console.error("Error querying AI:", error);
      return "Sorry, I encountered an error while processing your question. Please try again.";
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  clearDocuments() {
    this.embeddings.clear();
    this.documents.clear();
  }

  getDocumentCount(): number {
    return this.documents.size;
  }
}

export const aiEngine = new AIEngine();
