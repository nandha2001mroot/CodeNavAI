import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface Props {
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<Props> = ({ onSave }) => {
  const [key, setKey] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-850 border border-gray-700 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 bg-primary-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Enter Gemini API Key</h2>
          <p className="text-gray-400 text-center mt-2 text-sm">
            Your key is stored only in your browser memory for this session. 
            It is used directly to communicate with Google's APIs.
          </p>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); if(key) onSave(key); }}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all mb-4 font-mono"
            autoFocus
          />
          <button
            type="submit"
            disabled={!key}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Start Navigator
          </button>
        </form>
        <div className="mt-6 text-center">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary-500 text-sm hover:underline">
                Get an API Key here
            </a>
        </div>
      </div>
    </div>
  );
};