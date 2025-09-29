'use client';

import Link from "next/link";
import { useState } from "react";
import { GeneratedPreview } from "../lib/generated-content";
import CodeActions from "./CodeActions";

interface DesignPreviewCardProps {
  preview: GeneratedPreview | null;
  rank?: number;
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function getOutputDisplayName(outputPath: string): string {
  // Convert "generated-contract-summary" to "Contract Summary"
  return outputPath
    .replace(/^generated-/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function DesignPreviewCard({ preview, rank }: DesignPreviewCardProps) {
  const [showCode, setShowCode] = useState(false);

  if (!preview) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 text-center">
        <div className="text-gray-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Design Previews</h3>
        <p className="text-sm text-gray-600">
          Run the Figma → React converter to generate your first component preview.
        </p>
      </div>
    );
  }

  const displayName = getOutputDisplayName(preview.outputPath);
  const layerCount = preview.summaryData?.layerCount || 'Unknown';
  const warningCount = preview.summaryData?.warnings?.length || 0;
  
  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Design Preview</h3>
          <p className="text-sm text-gray-600">{displayName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            rank === 1 
              ? 'bg-green-100 text-green-800' 
              : rank === 2 
                ? 'bg-blue-100 text-blue-800' 
                : rank === 3
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
          }`}>
            {rank === 1 
              ? 'Most Recent' 
              : rank === 2 
                ? '2nd Most Recent' 
                : rank === 3
                  ? '3rd Most Recent'
                  : `#${rank}`
            }
          </span>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Component:</span>
          <span className="font-medium">{preview.baseComponent}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Version:</span>
          <span className="font-mono text-xs">{preview.versionDir}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Generated:</span>
          <span>{formatTimestamp(preview.runTimestamp)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Layers:</span>
          <span>{layerCount}</span>
        </div>
        {warningCount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Warnings:</span>
            <span className="text-amber-600">{warningCount}</span>
          </div>
        )}
      </div>
      
      <div className="flex space-x-3 mb-4">
        <Link
          href={`/preview/${encodeURIComponent(preview.outputPath)}/${encodeURIComponent(preview.versionDir)}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md text-center transition-colors"
        >
          View Component
        </Link>
        <button
          onClick={() => setShowCode(!showCode)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-md transition-colors"
        >
          {showCode ? 'Hide Code' : 'View Code'}
        </button>
      </div>
      
      {showCode && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Source Code</h4>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{preview.tsxContent}</code>
            </pre>
          </div>
          <CodeActions code={preview.tsxContent} />
        </div>
      )}
    </div>
  );
}