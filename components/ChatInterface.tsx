import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GroundingChunk } from '../types';
import { Send, Bot, User, FileCode, Loader2, Copy, Check, BrainCircuit, Globe, Image as ImageIcon, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (msg: string, options: { useThinking: boolean; useSearch: boolean; images: string[] }) => void;
  isLoading: boolean;
}

// Robust Regex-based language detection
const detectLanguage = (code: string): string => {
  const c = code.trim();
  if (c.startsWith('{') && c.endsWith('}')) return 'json';
  if (c.startsWith('[') && c.endsWith(']')) return 'json';
  if (c.startsWith('<') && (c.includes('</') || c.includes('/>') || c.includes('<!DOCTYPE'))) return 'xml';
  if (/fn\s+\w+/.test(c) || /let\s+mut\s+/.test(c) || /impl\s+.*\{/.test(c) || /println!/.test(c) || /pub\s+mod\s+/.test(c) || /match\s+.*\{/.test(c)) return 'rust';
  if (/package\s+main/.test(c) || /func\s+\w+\(/.test(c) || /fmt\.[A-Z]/.test(c) || /go\s+func/.test(c) || /:=\s*/.test(c)) return 'go';
  if (/public\s+class\s+\w+/.test(c) || /public\s+static\s+void\s+main/.test(c) || /System\.out\.print/.test(c) || /private\s+(String|int|boolean|void)\s+\w+/.test(c) || /extends\s+\w+/.test(c)) return 'java';
  if ((/def\s+\w+\s*\(/.test(c) && /:\s*$/.test(c)) || (/class\s+\w+(\(.*\))?\s*:/.test(c)) || (/if\s+__name__\s*==\s*['"]__main__['"]/.test(c)) || (/from\s+[\w.]+\s+import/.test(c)) || (/import\s+[\w.]+(\s+as\s+\w+)?$/.test(c))) return 'python';
  if (/\b(const|let|var)\s+\w+\s*=/.test(c) || /function\s+\w+\(/.test(c) || /=>/.test(c) || /console\.log/.test(c) || /export\s+(default\s+)?(class|function|const|interface|type)/.test(c)) {
      if (/\b(interface|type|enum)\s+\w+/.test(c) || /:\s*(string|number|boolean|any|void)/.test(c) || /<[A-Z]\w*>/.test(c)) return 'typescript';
      return 'javascript';
  }
  if (/#include\s+<.*>/.test(c) || /std::/.test(c) || /int\s+main\s*\(/.test(c) || /cout\s*<</.test(c)) return 'cpp';
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i.test(c) && /\b(FROM|INTO|TABLE|DATABASE)\b/i.test(c)) return 'sql';
  if (c.startsWith('$') || /npm\s+install/.test(c) || /pip\s+install/.test(c) || /docker\s+run/.test(c) || /git\s+commit/.test(c)) return 'bash';
  return 'text';
};

const LANGUAGE_MAP: Record<string, string> = {
  'js': 'JavaScript', 'javascript': 'JavaScript', 'ts': 'TypeScript', 'typescript': 'TypeScript',
  'py': 'Python', 'python': 'Python', 'go': 'Go', 'golang': 'Go', 'rs': 'Rust', 'rust': 'Rust',
  'java': 'Java', 'cpp': 'C++', 'c': 'C', 'html': 'HTML', 'css': 'CSS', 'json': 'JSON',
  'sql': 'SQL', 'bash': 'Shell', 'sh': 'Shell', 'zsh': 'Shell', 'xml': 'XML', 'text': 'Plain Text'
};

export const ChatInterface: React.FC<Props> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  
  // Feature Toggles
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  
  // Image Upload
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachedImages.length > 0) && !isLoading) {
      onSendMessage(input, { useThinking, useSearch, images: attachedImages });
      setInput('');
      setAttachedImages([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleThinking = () => {
      if (!useThinking) setUseSearch(false); // Mutually exclusive
      setUseThinking(!useThinking);
  };

  const toggleSearch = () => {
      if (!useSearch) setUseThinking(false); // Mutually exclusive
      setUseSearch(!useSearch);
  };

  const removeImage = (index: number) => {
      setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const onCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={onCopy} className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white" title="Copy code">
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
            <Bot className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">Ready to analyze your codebase</p>
            <p className="text-sm">Ask questions, upload diagrams, or enable Deep Thinking.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0 border border-primary-500/30">
                <Bot className="h-4 w-4 text-primary-500" />
              </div>
            )}
            
            <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Render Attached Images for User */}
              {msg.role === 'user' && msg.images && msg.images.length > 0 && (
                 <div className="flex flex-wrap gap-2 mb-2 justify-end">
                    {msg.images.map((img, i) => (
                        <img key={i} src={img} alt="Attached" className="h-32 w-auto rounded-lg border border-gray-700 shadow-md" />
                    ))}
                 </div>
              )}

              <div className={`rounded-2xl px-5 py-3 w-full ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-850 text-gray-200 border border-gray-750'}`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                         components={{
                            code(props: any) {
                                const {children, className, node, ...rest} = props;
                                const match = /language-(\w+)/.exec(className || '');
                                const codeContent = String(children).replace(/\n$/, '');
                                const isMultiLine = codeContent.includes('\n');

                                if (match || isMultiLine) {
                                    const detectedLang = match ? match[1] : detectLanguage(codeContent);
                                    const displayLang = LANGUAGE_MAP[detectedLang.toLowerCase()] || detectedLang;
                                    return (
                                        <div className="rounded-lg overflow-hidden my-3 border border-gray-800 shadow-sm">
                                            <div className="bg-gray-900 px-3 py-1.5 flex items-center justify-between border-b border-gray-800">
                                                <span className="text-xs text-gray-400 font-mono font-medium uppercase">{displayLang}</span>
                                                <CopyButton text={codeContent} />
                                            </div>
                                            <SyntaxHighlighter
                                                {...rest}
                                                children={codeContent}
                                                style={vscDarkPlus}
                                                language={detectedLang}
                                                PreTag="div"
                                                customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#020617', fontSize: '0.85rem', lineHeight: '1.5' }}
                                            />
                                        </div>
                                    );
                                } 
                                return <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-700 text-gray-200" {...rest}>{children}</code>;
                            }
                         }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {/* Citations / Sources */}
              {msg.role === 'model' && (
                  <div className="flex flex-col gap-2 mt-2 w-full">
                      {/* Code Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.slice(0, 3).map((source, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-gray-400 hover:text-gray-200 cursor-pointer transition-colors group">
                              <FileCode className="h-3 w-3 group-hover:text-primary-400 transition-colors" />
                              <span className="truncate max-w-[150px]">{source.filePath}</span>
                              <span className="opacity-50">L{source.startLine}-{source.endLine}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Search Grounding Sources */}
                      {msg.groundingSources && msg.groundingSources.length > 0 && (
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
                                  <Globe className="h-3 w-3" /> Sources from Web
                              </span>
                              <div className="flex flex-wrap gap-2">
                                  {msg.groundingSources.map((g, idx) => g.web?.uri && (
                                      <a key={idx} href={g.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded text-xs text-blue-400 hover:text-blue-300 transition-colors truncate max-w-xs">
                                          <Globe className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">{g.web.title || g.web.uri}</span>
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0 border border-primary-500/30">
               <Bot className="h-4 w-4 text-primary-500" />
            </div>
            <div className="bg-gray-850 rounded-2xl px-5 py-4 border border-gray-750 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
              <span className="text-sm text-gray-400 animate-pulse">
                  {useThinking ? 'Thinking deeply (Gemini 3 Pro)...' : useSearch ? 'Searching the web (Gemini Flash)...' : 'Analyzing codebase...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        {attachedImages.length > 0 && (
            <div className="flex gap-2 mb-2 px-2 overflow-x-auto">
                {attachedImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                        <img src={img} alt="preview" className="h-16 w-16 object-cover rounded-md border border-gray-700" />
                        <button onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto w-full">
          {/* Toolbar */}
          <div className="absolute -top-10 left-0 flex gap-2">
              <button 
                type="button" 
                onClick={toggleThinking}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${useThinking ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
              >
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Deep Think
              </button>
              <button 
                type="button" 
                onClick={toggleSearch}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${useSearch ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
              >
                  <Globe className="h-3.5 w-3.5" />
                  Web Search
              </button>
          </div>

          <div className="relative">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 rounded-md hover:bg-gray-800 transition-colors">
                <ImageIcon className="h-5 w-5" />
              </button>
              <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleImageSelect} 
                 accept="image/*" 
                 className="hidden" 
              />
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the repo, upload an image, or use tools..."
                className="w-full bg-gray-950 border border-gray-700 text-gray-100 rounded-xl pl-12 pr-12 py-4 focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none transition-all shadow-lg placeholder:text-gray-600 font-medium"
                disabled={isLoading}
              />
              
              <button
                type="submit"
                disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-md"
              >
                <Send className="h-5 w-5" />
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};