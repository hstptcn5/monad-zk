import React, { useState } from 'react';
import { CODE_SNIPPETS, PROJECT_STRUCTURE } from '../constants';

const CodeViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState(CODE_SNIPPETS[0]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 text-sm">
      {/* Sidebar / File Tree */}
      <div className="w-full lg:w-64 bg-monad-secondary/30 rounded-lg p-4 border border-monad-primary/20 shrink-0">
        <h3 className="text-monad-primary font-bold mb-4 uppercase tracking-wider text-xs">Project Explorer</h3>
        <div className="font-mono text-xs text-gray-400 whitespace-pre mb-6 overflow-x-auto">
            {PROJECT_STRUCTURE}
        </div>
        <div className="space-y-2">
            <h4 className="text-gray-300 font-semibold text-xs mb-2">Generated Files</h4>
          {CODE_SNIPPETS.map((snippet) => (
            <button
              key={snippet.filename}
              onClick={() => setActiveFile(snippet)}
              className={`w-full text-left px-3 py-2 rounded transition-colors truncate ${
                activeFile.filename === snippet.filename
                  ? 'bg-monad-primary text-white shadow-lg shadow-monad-primary/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {snippet.filename.split('/').pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 bg-[#0F0E17] rounded-lg border border-monad-primary/20 flex flex-col overflow-hidden">
        <div className="bg-white/5 px-4 py-2 border-b border-monad-primary/20 flex justify-between items-center">
          <span className="font-mono text-monad-primary">{activeFile.filename}</span>
          <span className="text-xs text-gray-500 uppercase">{activeFile.language}</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="font-mono text-gray-300 leading-relaxed">
            <code>{activeFile.content}</code>
          </pre>
        </div>
        <div className="bg-monad-secondary/50 p-3 text-xs text-gray-400 border-t border-monad-primary/10">
            {activeFile.description}
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;