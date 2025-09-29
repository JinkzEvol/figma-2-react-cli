'use client';

import React, { useState, useEffect } from 'react';

interface DynamicComponentRendererProps {
  tsxContent: string;
  componentName: string;
}

export default function DynamicComponentRenderer({ tsxContent, componentName }: DynamicComponentRendererProps) {
  const [RenderedComponent, setRenderedComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, let's create a simple representation of the component
        // since we can't easily execute arbitrary TSX in the browser without a build step
        const lines = tsxContent.split('\n').filter(line => line.trim());
        const hasDataNode = tsxContent.includes('data-node="root"');
        const hasFlexCol = tsxContent.includes('flex-col');
        
        // Create a simple visual representation based on the component structure
        const SimpleComponent = () => {
          if (hasDataNode && hasFlexCol) {
            return (
              <div className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-blue-800">Root Container</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      data-node="root"
                    </div>
                  </div>
                  <div className="bg-gray-100 border border-gray-300 p-3 rounded">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-2"></div>
                        <div className="text-xs text-gray-600">Generated Component Content</div>
                        <div className="text-xs text-gray-500 mt-1">className="flex flex-col"</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          // Fallback for other component structures
          return (
            <div className="p-4">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-6 rounded-lg border border-indigo-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-indigo-800 mb-2">{componentName}</h3>
                  <div className="space-y-1">
                    <div className="text-sm text-indigo-600">Lines of code: {lines.length}</div>
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {tsxContent.includes('className') && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">styled</span>
                      )}
                      {tsxContent.includes('data-node') && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">data-node</span>
                      )}
                      {tsxContent.includes('flex') && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">flexbox</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        };
        
        setRenderedComponent(() => SimpleComponent);
      } catch (err) {
        console.error('Error rendering component:', err);
        setError(err instanceof Error ? err.message : 'Failed to render component');
      } finally {
        setLoading(false);
      }
    };

    if (tsxContent && componentName) {
      renderComponent();
    }
  }, [tsxContent, componentName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Rendering component...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-red-800 mb-1">Rendering Error</h3>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!RenderedComponent) {
    return (
      <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-gray-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">{componentName}</h3>
          <p className="text-xs text-gray-500">No component to render</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
        <RenderedComponent />
      </div>
    </div>
  );
}