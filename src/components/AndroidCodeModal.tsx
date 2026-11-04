import React, { useState } from 'react';
import { Code2, Copy, Check, X, FileCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeFile, setActiveFile] = useState<'app' | 'gradle'>('app');

  if (!isOpen) return null;

  const appCode = `// Production Jetpack Compose LPG Manager Code
package com.lpgmanager.app

import androidx.compose.runtime.*
import androidx.compose.material3.*

@Composable
fun LpgDeliveryApp() {
    // Android Compose Native UI matching Web Firebase Firestore schema
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Native Android Kotlin Source</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-emerald-300 overflow-x-auto">
            {appCode}
          </pre>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Kotlin Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
