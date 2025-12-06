export interface FileNode {
  name: string;
  path: string;
  content: string | null;
  isDirectory: boolean;
  children?: FileNode[];
  extension?: string;
}

export interface CodeChunk {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  embedding?: number[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  sources?: CodeChunk[];
  groundingSources?: GroundingChunk[];
  isThinking?: boolean;
  images?: string[]; // base64 strings
}

export enum ProcessingStatus {
  IDLE = 'idle',
  READING = 'reading',
  CHUNKING = 'chunking',
  EMBEDDING = 'embedding',
  READY = 'ready',
  ERROR = 'error'
}

export interface Settings {
  apiKey: string;
  model: string;
  chunkSize: number;
}

export interface GenerationOptions {
  useThinking: boolean;
  useSearch: boolean;
  images: string[]; // base64 strings
}