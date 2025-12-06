export const GEMINI_MODEL_REASONING = 'gemini-3-pro-preview';
export const GEMINI_MODEL_EMBEDDINGS = 'text-embedding-004';
export const GEMINI_MODEL_FLASH = 'gemini-2.5-flash';

// Extensions to ignore during indexing to save tokens/performance
export const IGNORED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.pyc', '.class', '.o', '.obj',
  '.lock', '.json' // Depending on use case, sometimes JSON is noise
];

export const IGNORED_DIRECTORIES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.idea',
  '.vscode',
  '__pycache__',
  'coverage',
  'venv',
  '.next',
  'target' // Rust/Java
];

export const CHUNK_SIZE_DEFAULT = 600; // Characters approx
export const CHUNK_OVERLAP = 100;