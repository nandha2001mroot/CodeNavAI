import React, { useState } from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, Folder, FileText, Code, FileCode2 } from 'lucide-react';

interface Props {
  node: FileNode;
  level?: number;
}

export const FileTree: React.FC<Props> = ({ node, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Simple icon selector based on extension/type
  const getIcon = () => {
    if (node.isDirectory) return isOpen ? <Folder className="h-4 w-4 text-blue-400" /> : <Folder className="h-4 w-4 text-blue-300" />;
    const ext = node.extension;
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return <Code className="h-4 w-4 text-yellow-400" />;
    if (['css', 'html'].includes(ext || '')) return <FileCode2 className="h-4 w-4 text-orange-400" />;
    if (['json', 'md'].includes(ext || '')) return <FileText className="h-4 w-4 text-gray-400" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const handleToggle = () => {
    if (node.isDirectory) setIsOpen(!isOpen);
  };

  // Don't render the 'root' container visually, just its children
  if (node.name === 'root') {
    return (
      <div className="pl-2">
        {node.children?.map((child) => (
          <FileTree key={child.path} node={child} level={0} />
        ))}
      </div>
    );
  }

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-800 rounded cursor-pointer text-sm transition-colors text-gray-300 hover:text-white`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleToggle}
      >
        <span className="opacity-70">
            {node.isDirectory && (
                isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
            )}
            {!node.isDirectory && <span className="w-3 h-3 inline-block" />}
        </span>
        {getIcon()}
        <span className="truncate">{node.name}</span>
      </div>
      
      {isOpen && node.children && (
        <div className="border-l border-gray-800 ml-[15px]">
          {node.children.map((child) => (
            <FileTree key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};