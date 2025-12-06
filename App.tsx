import React, { useState, useEffect } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ChatInterface } from './components/ChatInterface';
import { FileTree } from './components/FileTree';
import { FileNode, ProcessingStatus, ChatMessage, CodeChunk } from './types';
import { processDirectoryUpload } from './services/fileProcessor';
import { initializeGemini, embedChunks, embedQuery, generateRAGResponse } from './services/geminiService';
import { vectorStore } from './services/vectorEngine';
import { UploadCloud, FolderOpen, Search, Zap, AlertCircle } from 'lucide-react';

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({ files: 0, chunks: 0 });

  useEffect(() => {
    const envKey = process.env.API_KEY;
    if(envKey) {
      setApiKey(envKey);
      initializeGemini(envKey);
    }
  }, []);

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    initializeGemini(key);
  };

  const getFriendlyErrorMessage = (error: any): string => {
    const msg = error?.message || error?.toString() || '';
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource exhausted')) {
      return "⚠️ API Quota Exceeded. The free tier limits have been reached. Please wait a minute before trying again.";
    }
    if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('invalid api key')) {
      return "🔒 Authentication Error. Your API key appears to be invalid or expired.";
    }
    if (msg.includes('503') || msg.includes('overloaded')) {
      return "🛑 Service Overloaded. The Gemini API is currently experiencing high traffic.";
    }
    return `❌ Error: ${msg.substring(0, 150)}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const { root, chunks } = await processDirectoryUpload(
        e.target.files, 
        setStatus, 
        setProgressMsg
      );

      if (chunks.length === 0) {
           setStatus(ProcessingStatus.ERROR);
           setProgressMsg("No valid text files found to index.");
           return;
      }

      setFileTree(root);
      setStats(prev => ({ ...prev, files: e.target.files!.length }));

      setStatus(ProcessingStatus.EMBEDDING);
      setProgressMsg(`Starting embedding generation for ${chunks.length} chunks...`);
      
      const embeddedChunks = await embedChunks(chunks, (completed, total) => {
        setProgressMsg(`Embedding chunks: ${completed}/${total} (Rate limited)`);
      });
      
      if (embeddedChunks.length === 0) {
          throw new Error("Failed to generate any embeddings. Check API Key or Quota.");
      }
      
      vectorStore.clear();
      vectorStore.addChunks(embeddedChunks);
      setStats(prev => ({ ...prev, chunks: embeddedChunks.length }));

      setStatus(ProcessingStatus.READY);
      setProgressMsg("Ready to chat!");
      
      setMessages([{
        id: 'init',
        role: 'model',
        content: `I've indexed ${e.target.files.length} files (${embeddedChunks.length} chunks). Ask me anything about this codebase!`,
        timestamp: Date.now()
      }]);

    } catch (err: any) {
      console.error("Upload Error:", err);
      setStatus(ProcessingStatus.ERROR);
      const friendlyMsg = getFriendlyErrorMessage(err);
      setProgressMsg(friendlyMsg);
    }
  };

  const handleSendMessage = async (text: string, options: { useThinking: boolean; useSearch: boolean; images: string[] }) => {
    if (!text.trim() && options.images.length === 0) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      images: options.images // Store images for display
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // 1. Context Retrieval (Text only)
      // Only perform vector search if there is text input. 
      // Images alone might not need vector search, but we can't search images with text embeddings directly here anyway.
      let relevantChunks: CodeChunk[] = [];
      if (text.trim().length > 0) {
          const queryEmbedding = await embedQuery(text);
          relevantChunks = vectorStore.search(queryEmbedding, 8);
      }

      // 2. Generate Response
      const { text: responseText, groundingMetadata } = await generateRAGResponse(text, relevantChunks, options);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
        sources: relevantChunks,
        groundingSources: groundingMetadata,
        isThinking: options.useThinking
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      const friendlyMsg = getFriendlyErrorMessage(error);
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: friendlyMsg,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!apiKey) {
    return <ApiKeyModal onSave={handleApiKeySave} />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-100 overflow-hidden">
      
      {/* Sidebar - File Tree */}
      <div className="w-72 border-r border-gray-800 bg-gray-900 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary-500" />
            <span className="font-bold text-lg tracking-tight">CodeNav<span className="text-primary-500">AI</span></span>
        </div>
        
        <div className="p-4 border-b border-gray-800">
           {status !== ProcessingStatus.READY && status !== ProcessingStatus.IDLE ? (
             <div className="space-y-2">
                <div className={`flex items-center gap-2 text-sm ${status === ProcessingStatus.ERROR ? 'text-red-400' : 'text-primary-400 animate-pulse'}`}>
                    {status === ProcessingStatus.ERROR ? <AlertCircle className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                    <span>{status === ProcessingStatus.ERROR ? 'Error' : 'Processing...'}</span>
                </div>
                {status !== ProcessingStatus.ERROR && (
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 animate-progress"></div>
                    </div>
                )}
                <p className={`text-xs ${status === ProcessingStatus.ERROR ? 'text-red-400 font-medium' : 'text-gray-500'}`}>{progressMsg}</p>
             </div>
           ) : (
             <div className="relative group">
                <input 
                    type="file" 
                    // @ts-ignore - directory support
                    webkitdirectory=""
                    directory="" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    onChange={handleFileUpload}
                />
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-700 group-hover:border-gray-500">
                    <FolderOpen className="h-4 w-4" />
                    Upload Folder
                </button>
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {fileTree ? (
                <FileTree node={fileTree} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2">
                    <Search className="h-8 w-8 opacity-20" />
                    <p className="text-xs">No files loaded</p>
                </div>
            )}
        </div>

        {stats.files > 0 && (
            <div className="p-3 bg-gray-850 border-t border-gray-800 text-xs text-gray-400 flex justify-between">
                <span>{stats.files} Files</span>
                <span>{stats.chunks} Chunks</span>
            </div>
        )}
      </div>

      {/* Main Content - Chat */}
      <div className="flex-1 flex flex-col h-full relative">
         <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center px-6 justify-between md:hidden">
            <span className="font-bold">CodeNav AI</span>
            <label className="p-2 bg-gray-800 rounded cursor-pointer">
                <UploadCloud className="h-5 w-5" />
                <input 
                    type="file" 
                    // @ts-ignore
                    webkitdirectory=""
                    directory="" 
                    multiple 
                    className="hidden"
                    onChange={handleFileUpload}
                />
            </label>
         </header>

         <main className="flex-1 overflow-hidden relative">
            {status === ProcessingStatus.IDLE && !fileTree ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-950">
                    <div className="max-w-md space-y-6">
                        <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto border border-gray-800 shadow-xl">
                            <UploadCloud className="h-10 w-10 text-primary-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Project Navigator</h1>
                        <p className="text-gray-400">
                            Upload your React, Python, or Node.js codebase. 
                            We'll index it locally in your browser and let you chat with it using 
                            <span className="text-primary-400 font-semibold"> Gemini 3 Pro</span>.
                        </p>
                        
                        <div className="relative inline-block">
                             <input 
                                type="file" 
                                // @ts-ignore
                                webkitdirectory=""
                                directory="" 
                                multiple 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                            />
                            <button className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary-900/20 transform hover:-translate-y-0.5">
                                Select Project Folder
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-4">Processed locally in browser. No code is uploaded to a 3rd party server (except sent to Gemini API for analysis).</p>
                    </div>
                </div>
            ) : (
                <ChatInterface 
                    messages={messages} 
                    onSendMessage={handleSendMessage} 
                    isLoading={isProcessing} 
                />
            )}
         </main>
      </div>
    </div>
  );
}

export default App;