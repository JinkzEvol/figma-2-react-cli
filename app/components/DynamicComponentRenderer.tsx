'use client';

import React, { useState, useEffect } from 'react';

interface DynamicComponentRendererProps {
  tsxContent: string;
  componentName: string;
}

// Parse TSX content to extract JSX structure
function parseTsxContent(tsxContent: string): string | null {
  try {
    // Enhanced regex parsing for multiple TSX formats
    let jsxMatch = tsxContent.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
    if (!jsxMatch) {
      jsxMatch = tsxContent.match(/return\s+([\s\S]*?);/);
    }
    
    if (jsxMatch && jsxMatch[1]) {
      return jsxMatch[1].trim();
    }
    return null;
  } catch (error) {
    console.error('Error parsing TSX content:', error);
    return null;
  }
}

// Parse individual element attributes
function parseAttributes(attrsStr: string): { className?: string; dataNode?: string; [key: string]: string | undefined } {
  const result: { className?: string; dataNode?: string; [key: string]: string | undefined } = {};
  
  // Multi-format support for className
  const classMatch = attrsStr.match(/className="([^"]*)"/) || 
                    attrsStr.match(/className='([^']*)'/) || 
                    attrsStr.match(/className={`([^`]*)`}/);
  if (classMatch) {
    result.className = classMatch[1];
  }
  
  // Multi-format support for data-node
  const dataNodeMatch = attrsStr.match(/data-node="([^"]*)"/) || 
                        attrsStr.match(/data-node='([^']*)'/) || 
                        attrsStr.match(/data-node={`([^`]*)`}/);
  if (dataNodeMatch) {
    result.dataNode = dataNodeMatch[1];
  }
  
  return result;
}

// Create React element from JSX string with visual enhancements
function createElementFromJsx(jsxStr: string, depth = 0): React.ReactElement {
  const trimmed = jsxStr.trim();
  
  // Handle self-closing div tags
  const selfClosingMatch = trimmed.match(/^<div([^>]*)\/?>$/);
  if (selfClosingMatch) {
    const attrs = parseAttributes(selfClosingMatch[1] || '');
    const enhancedClassName = `${attrs.className || ''} border border-dashed border-gray-300 min-h-[2rem] p-2 relative`.trim();
    
    return React.createElement('div', {
      key: `element-${depth}-${attrs.dataNode || 'unknown'}`,
      className: enhancedClassName,
    }, [
      // Data-node label
      attrs.dataNode && React.createElement('span', {
        key: `label-${attrs.dataNode}`,
        className: 'absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-br transform -translate-y-0.5 -translate-x-0.5',
      }, attrs.dataNode),
      // Empty div indicator
      React.createElement('div', {
        key: `indicator-${attrs.dataNode || 'empty'}`,
        className: 'text-gray-400 text-xs text-center py-1',
      }, attrs.dataNode ? `[${attrs.dataNode}]` : '[empty div]')
    ]);
  }
  
  // Handle div with content
  const divMatch = trimmed.match(/^<div([^>]*)>([\s\S]*)<\/div>$/);
  if (divMatch) {
    const attrs = parseAttributes(divMatch[1] || '');
    const content = divMatch[2].trim();
    const enhancedClassName = `${attrs.className || ''} border border-dashed border-gray-300 p-2 relative`.trim();
    
    const children: React.ReactNode[] = [];
    
    // Add data-node label
    if (attrs.dataNode) {
      children.push(React.createElement('span', {
        key: `label-${attrs.dataNode}`,
        className: 'absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-br transform -translate-y-0.5 -translate-x-0.5 z-10',
      }, attrs.dataNode));
    }
    
    // Parse nested content
    if (content) {
      const nestedElements = parseNestedElements(content, depth + 1);
      children.push(...nestedElements);
    } else {
      // Empty div indicator
      children.push(React.createElement('div', {
        key: `indicator-${attrs.dataNode || 'empty'}`,
        className: 'text-gray-400 text-xs text-center py-1',
      }, attrs.dataNode ? `[${attrs.dataNode}]` : '[empty div]'));
    }
    
    return React.createElement('div', {
      key: `element-${depth}-${attrs.dataNode || 'unknown'}`,
      className: enhancedClassName,
    }, children);
  }
  
  // Fallback for unrecognized JSX
  return React.createElement('div', {
    key: `fallback-${depth}`,
    className: 'border border-dashed border-red-300 p-2 bg-red-50 text-red-600 text-xs',
  }, `Unrecognized JSX: ${trimmed.slice(0, 50)}...`);
}

// Parse multiple nested elements
function parseNestedElements(content: string, depth = 0): React.ReactElement[] {
  const elements: React.ReactElement[] = [];
  let currentPos = 0;
  
  while (currentPos < content.length) {
    const remaining = content.slice(currentPos);
    
    // Find next div element
    const divStart = remaining.search(/<div/);
    if (divStart === -1) break;
    
    const fullStart = currentPos + divStart;
    let tagDepth = 0;
    let pos = fullStart;
    let inQuotes = false;
    let quoteChar = '';
    
    // Find matching closing tag
    while (pos < content.length) {
      const char = content[pos];
      
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      } else if (!inQuotes) {
        if (content.slice(pos, pos + 4) === '<div') {
          tagDepth++;
          pos += 3; // Skip ahead
        } else if (content.slice(pos, pos + 6) === '</div>') {
          tagDepth--;
          if (tagDepth === 0) {
            pos += 5; // Include the closing >
            break;
          }
          pos += 5; // Skip ahead
        } else if (content.slice(pos, pos + 2) === '/>' && tagDepth === 1) {
          // Self-closing tag
          pos += 1; // Include the >
          break;
        }
      }
      pos++;
    }
    
    if (tagDepth === 0) {
      const elementStr = content.slice(fullStart, pos + 1);
      elements.push(createElementFromJsx(elementStr, depth));
      currentPos = pos + 1;
    } else {
      // Malformed JSX, skip
      break;
    }
  }
  
  return elements;
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

        // Parse TSX content to extract JSX
        const jsxContent = parseTsxContent(tsxContent);
        
        if (!jsxContent) {
          throw new Error('Could not parse JSX from TSX content');
        }

        // Create dynamic component
        const DynamicComponent = () => {
          try {
            const elements = parseNestedElements(jsxContent);
            
            if (elements.length === 0) {
              return React.createElement('div', {
                className: 'border border-dashed border-gray-300 p-4 text-center text-gray-500',
              }, 'No elements found');
            }
            
            return React.createElement('div', {
              className: 'space-y-2',
            }, elements);
          } catch (renderError) {
            console.error('Error during dynamic rendering:', renderError);
            return React.createElement('div', {
              className: 'border border-dashed border-red-300 p-4 bg-red-50 text-red-600',
            }, `Render error: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`);
          }
        };
        
        setRenderedComponent(() => DynamicComponent);
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
    // Enhanced fallback with TSX structure display
    const lines = tsxContent.split('\n').filter(line => line.trim());
    
    return (
      <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-gray-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">{componentName}</h3>
          <p className="text-xs text-gray-500 mb-3">Enhanced placeholder with structure info</p>
          
          <div className="space-y-1 text-xs">
            <div className="text-gray-600">Lines of code: {lines.length}</div>
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