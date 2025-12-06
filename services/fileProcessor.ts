import { FileNode, CodeChunk, ProcessingStatus } from '../types';
import { IGNORED_EXTENSIONS, IGNORED_DIRECTORIES, CHUNK_SIZE_DEFAULT, CHUNK_OVERLAP } from '../constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Reads a FileList (from <input type="file" webkitdirectory />) 
 * and processes it into a file tree and flat list of indexable text files.
 */
export const processDirectoryUpload = async (
  files: FileList, 
  setStatus: (s: ProcessingStatus) => void,
  setProgress: (msg: string) => void
): Promise<{ root: FileNode; chunks: CodeChunk[] }> => {
  
  setStatus(ProcessingStatus.READING);
  setProgress("Scanning files...");

  const root: FileNode = { name: 'root', path: '', isDirectory: true, children: [], content: null };
  const textFiles: { path: string; content: string }[] = [];

  const fileArray = Array.from(files);
  const totalFiles = fileArray.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = fileArray[i];
    
    // WebkitRelativePath is e.g. "my-repo/src/index.ts"
    const pathParts = file.webkitRelativePath.split('/');
    // Skip the root folder name if desired, or keep it. Usually webkitdirectory includes the folder name as first part.
    
    if (shouldIgnore(file.webkitRelativePath)) continue;

    // Build Tree Node
    let currentDir = root;
    for (let j = 0; j < pathParts.length - 1; j++) {
      const part = pathParts[j];
      let existing = currentDir.children?.find(c => c.name === part);
      if (!existing) {
        existing = { name: part, path: pathParts.slice(0, j + 1).join('/'), isDirectory: true, children: [], content: null };
        currentDir.children = currentDir.children || [];
        currentDir.children.push(existing);
      }
      currentDir = existing;
    }

    const fileName = pathParts[pathParts.length - 1];
    
    // Read Content if text
    if (isTextFile(fileName)) {
        try {
            const content = await readFileAsText(file);
            if (content.trim().length > 0) { // Only add non-empty files
                const fileNode: FileNode = {
                    name: fileName,
                    path: file.webkitRelativePath,
                    isDirectory: false,
                    content: content,
                    extension: fileName.split('.').pop()
                };
                currentDir.children = currentDir.children || [];
                currentDir.children.push(fileNode);
                textFiles.push({ path: file.webkitRelativePath, content });
            }
        } catch (e) {
            console.warn(`Could not read ${fileName}`, e);
        }
    }
  }

  setStatus(ProcessingStatus.CHUNKING);
  setProgress(`Chunking ${textFiles.length} text files...`);
  
  const chunks = chunkFiles(textFiles);

  return { root, chunks };
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

const shouldIgnore = (path: string): boolean => {
  const parts = path.split('/');
  // Check directories
  if (parts.some(p => IGNORED_DIRECTORIES.includes(p))) return true;
  // Check extensions
  const ext = '.' + path.split('.').pop()?.toLowerCase();
  if (IGNORED_EXTENSIONS.includes(ext)) return true;
  return false;
};

const isTextFile = (name: string): boolean => {
    const ext = '.' + name.split('.').pop()?.toLowerCase();
    // Allow code extensions or unknown extensions that aren't explicitly binary
    return !IGNORED_EXTENSIONS.includes(ext); 
};

/**
 * Breaks files into overlapping chunks for embedding.
 */
const chunkFiles = (files: { path: string; content: string }[]): CodeChunk[] => {
  const chunks: CodeChunk[] = [];

  files.forEach(file => {
    const lines = file.content.split('\n');
    let currentChunkLines: string[] = [];
    let currentSize = 0;
    let startLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentChunkLines.push(line);
      currentSize += line.length;

      if (currentSize >= CHUNK_SIZE_DEFAULT || i === lines.length - 1) {
        const textContent = currentChunkLines.join('\n');
        
        // Ensure we don't create empty chunks
        if (textContent.trim().length > 0) {
            chunks.push({
              id: uuidv4(),
              filePath: file.path,
              startLine: startLine,
              endLine: i + 1,
              content: textContent
            });
        }

        // Setup overlap for next chunk
        // Keep last N lines that fit into CHUNK_OVERLAP
        let overlapSize = 0;
        let overlapLines: string[] = [];
        for (let j = currentChunkLines.length - 1; j >= 0; j--) {
           overlapSize += currentChunkLines[j].length;
           overlapLines.unshift(currentChunkLines[j]);
           if (overlapSize >= CHUNK_OVERLAP) break;
        }

        currentChunkLines = overlapLines;
        currentSize = overlapSize;
        startLine = (i + 1) - currentChunkLines.length + 1;
      }
    }
  });

  return chunks;
};