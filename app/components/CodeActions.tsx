'use client';

import { useState } from 'react';

interface CodeActionsProps {
  code: string;
}

export default function CodeActions({ code }: CodeActionsProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GeneratedComponent.tsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 flex space-x-2">
      <button
        onClick={handleCopy}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
      >
        {isCopied ? 'Copied!' : 'Copy Code'}
      </button>
      <button
        onClick={handleDownload}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-md transition-colors"
      >
        Download
      </button>
    </div>
  );
}