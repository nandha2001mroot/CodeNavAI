import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_REASONING, GEMINI_MODEL_EMBEDDINGS, GEMINI_MODEL_FLASH } from '../constants';
import { CodeChunk, GenerationOptions, GroundingChunk } from '../types';

let genAI: GoogleGenAI | null = null;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 5, initialDelay = 2000): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      const msg = error?.message || '';
      const status = error?.status || error?.code;
      
      const isTransient = status === 429 || 
                          status === 503 || 
                          msg.includes('Quota') || 
                          msg.includes('429') ||
                          msg.includes('Overloaded');

      if (isTransient && retries < maxRetries) {
        const delayTime = initialDelay * Math.pow(2, retries);
        await sleep(delayTime);
        retries++;
      } else {
        throw error;
      }
    }
  }
}

export const initializeGemini = (apiKey: string) => {
  genAI = new GoogleGenAI({ apiKey });
};

/**
 * Generates embeddings for a batch of text chunks.
 * Uses batching, delays, and retries to respect API rate limits.
 */
export const embedChunks = async (
    chunks: CodeChunk[], 
    onProgress?: (completed: number, total: number) => void
): Promise<CodeChunk[]> => {
  if (!genAI) throw new Error("Gemini API not initialized");

  const validChunks = chunks.filter(c => c.content && c.content.trim().length > 0);
  const totalChunks = validChunks.length;
  
  const BATCH_SIZE = 5; 
  const DELAY_BETWEEN_BATCHES = 1000; 
  
  let completedCount = 0;

  for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
    const batch = validChunks.slice(i, i + BATCH_SIZE);
    
    try {
        await retryOperation(async () => {
            const promises = batch.map(async (chunk) => {
                const result = await genAI!.models.embedContent({
                    model: GEMINI_MODEL_EMBEDDINGS,
                    contents: chunk.content,
                });

                if (result && result.embeddings && result.embeddings.length > 0 && result.embeddings[0].values) {
                     chunk.embedding = Array.from(result.embeddings[0].values);
                }
            });

            await Promise.all(promises);
        });
    } catch (e) {
        console.error(`Failed to embed batch starting at index ${i}`, e);
    } finally {
        completedCount += batch.length;
        if (onProgress) {
            onProgress(completedCount, totalChunks);
        }
    }

    if (i + BATCH_SIZE < totalChunks) {
        await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  return validChunks.filter(c => c.embedding !== undefined);
};

export const embedQuery = async (text: string): Promise<number[]> => {
  if (!genAI) throw new Error("Gemini API not initialized");
  if (!text || text.trim().length === 0) throw new Error("Query text cannot be empty");
  
  return await retryOperation(async () => {
      const result = await genAI!.models.embedContent({
        model: GEMINI_MODEL_EMBEDDINGS,
        contents: text,
      });

      if (!result || !result.embeddings || result.embeddings.length === 0 || !result.embeddings[0].values) {
        throw new Error("Failed to generate query embedding");
      }

      return Array.from(result.embeddings[0].values);
  });
};

/**
 * RAG Chat Generation using Gemini
 * Supports: Thinking Mode, Search Grounding, and Image Analysis
 */
export const generateRAGResponse = async (
  query: string,
  contextChunks: CodeChunk[],
  options: GenerationOptions
): Promise<{ text: string; groundingMetadata?: GroundingChunk[] }> => {
  if (!genAI) throw new Error("Gemini API not initialized");

  // Determine Model and Config
  let model = GEMINI_MODEL_REASONING; // Default to 3 Pro
  const config: any = {
    temperature: 0.2,
  };
  
  // Logic: 
  // 1. If Search is requested -> MUST use Flash (per requirements)
  // 2. If Thinking is requested -> MUST use Pro + Thinking Config (and NO Search)
  // 3. If Images -> MUST use Pro (per requirements)
  
  if (options.useSearch) {
    model = GEMINI_MODEL_FLASH;
    config.tools = [{ googleSearch: {} }];
    config.temperature = 0.7; // Slightly higher for web synthesis
  } else if (options.useThinking) {
    model = GEMINI_MODEL_REASONING;
    config.thinkingConfig = { thinkingBudget: 32768 };
    // IMPORTANT: maxOutputTokens must NOT be set when thinkingConfig is used
  }

  // Build Context String
  const contextString = contextChunks.map(chunk => 
    `File: ${chunk.filePath} (Lines ${chunk.startLine}-${chunk.endLine})\n\`\`\`\n${chunk.content}\n\`\`\``
  ).join('\n\n');

  const systemInstruction = `You are an elite senior software engineer analyzing a codebase.
  
  CONTEXT:
  The user has uploaded a repository. You have been provided with RELEVANT CODE CHUNKS found via vector search.
  
  INSTRUCTIONS:
  1. Answer the user's question based strictly on the provided context.
  2. If the context is insufficient, state that you need more information.
  3. CITATIONS: When referencing code, explicitly mention the file path and line numbers.
  4. FORMAT: Use Markdown. Use code blocks. Be concise but deep in reasoning.
  
  ${options.useSearch ? '5. WEB SEARCH: You have access to Google Search. Use it to find up-to-date libraries, docs, or recent issues if the local code is ambiguous.' : ''}
  ${options.useThinking ? '5. THINKING: You are in Deep Reasoning mode. Think step-by-step through complex architectural or logic problems.' : ''}
  `;

  const promptText = `Here is the relevant code context:\n\n${contextString}\n\nUser Question: ${query}`;

  // Build Content Parts (Multimodal)
  const parts: any[] = [];
  
  // Add Images if present
  if (options.images && options.images.length > 0) {
    options.images.forEach(base64Data => {
       // Strip prefix if present (data:image/png;base64,)
       const cleanData = base64Data.split(',')[1] || base64Data;
       parts.push({
         inlineData: {
           mimeType: 'image/png', // Assume PNG/JPEG generic handling
           data: cleanData
         }
       });
    });
  }

  parts.push({ text: promptText });

  return await retryOperation(async () => {
      const response = await genAI!.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
            systemInstruction: systemInstruction,
            ...config
        }
      });

      const text = response.text || "No response generated.";
      
      // Extract grounding metadata if search was used
      let groundingMetadata: GroundingChunk[] | undefined;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        // @ts-ignore - mismatch in SDK types vs runtime
        groundingMetadata = chunks as GroundingChunk[];
      }

      return { text, groundingMetadata };
  });
};