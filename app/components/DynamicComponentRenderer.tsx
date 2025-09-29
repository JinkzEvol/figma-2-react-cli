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
    // Extract and create a React component from TSX string
    const extractComponentFunction = (tsxContent: string): React.ComponentType | null => {
      try {
        // Extract the JSX return content from the component
        // Try to match parenthesized return first
        let jsxMatch = tsxContent.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
        // If not found, try to match non-parenthesized return (single-line or multi-line)
        if (!jsxMatch) {
          jsxMatch = tsxContent.match(/return\s+([\s\S]*?);/);
        }
        if (!jsxMatch) {
          return null;
        }

        const jsxContent = jsxMatch[1].trim();
        
        // Transform JSX to React.createElement calls
        const reactElement = parseJSXToReactElement(jsxContent);
        
        if (reactElement) {
          const DynamicComponent = () => reactElement;
          DynamicComponent.displayName = 'DynamicComponent';
          return DynamicComponent;
        }
        
        return null;
      } catch (err) {
        console.error('Error extracting component function:', err);
        return null;
      }
    };

    const renderComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Parse the TSX content to extract the JSX
        const componentFunction = extractComponentFunction(tsxContent);
        if (componentFunction) {
          setRenderedComponent(() => componentFunction);
        } else {
          throw new Error('Could not parse component');
        }
      } catch (err) {
        console.error('Error rendering component:', err);
        setError(err instanceof Error ? err.message : 'Failed to render component');
        
        // Fallback to a visual representation
        setRenderedComponent(() => createFallbackComponent(tsxContent, componentName));
      } finally {
        setLoading(false);
      }
    };

    if (tsxContent && componentName) {
      renderComponent();
    }
  }, [tsxContent, componentName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse JSX string to React element (simplified parser for our specific use case)
  const parseJSXToReactElement = (jsx: string): React.ReactElement | null => {
    try {
      // Clean and normalize the JSX
      jsx = jsx.trim();
      
      // Handle self-closing tags and convert to React.createElement
      // This is a simplified parser for the specific structure we expect
      if (jsx.startsWith('<div') && jsx.endsWith('</div>')) {
        return parseDiv(jsx);
      }
      
      return null;
    } catch (err) {
      console.error('Error parsing JSX:', err);
      return null;
    }
  };

  // Parse a div element and its children
  const parseDiv = (divStr: string): React.ReactElement => {
    // Extract attributes from opening tag
    const openTagMatch = divStr.match(/<div([^>]*)>/);
    const props: Record<string, unknown> = {};
    
    if (openTagMatch && openTagMatch[1]) {
      const attrsStr = openTagMatch[1].trim();
      // Parse className
      // Parse className (double quotes, single quotes, or template literals)
      let classMatch =
        attrsStr.match(/className="([^"]*)"/) ||
        attrsStr.match(/className='([^']*)'/) ||
        attrsStr.match(/className={`([^`]*)`}/);
      if (classMatch) {
        props.className = classMatch[1];
      }
      // Parse data-node (double quotes, single quotes, or template literals)
      let dataNodeMatch =
        attrsStr.match(/data-node="([^"]*)"/) ||
        attrsStr.match(/data-node='([^']*)'/) ||
        attrsStr.match(/data-node={`([^`]*)`}/);
      if (dataNodeMatch) {
        props['data-node'] = dataNodeMatch[1];
      }
    }

    // Add visual styling to make the rendered components visible
    const baseClasses = props.className ? `${props.className}` : '';
    const nodeId = props['data-node'] as string;
    
    // Add border and background to make structure visible
    props.className = `${baseClasses} border border-dashed border-gray-300 bg-gray-50 p-2 m-1 rounded`.trim();
    props.style = {
      minHeight: '20px',
      position: 'relative'
    };

    // Extract content between opening and closing tags
    const contentMatch = divStr.match(/<div[^>]*>([\s\S]*)<\/div>$/);
    const content = contentMatch ? contentMatch[1].trim() : '';
    
    // Parse children
    const children: React.ReactNode[] = [];
    
    // Add a visual label to show the data-node value
    if (nodeId) {
      children.push(
        React.createElement('div', {
          key: 'node-label',
          className: 'absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 rounded-br',
          style: { fontSize: '10px', lineHeight: '1.2' }
        }, nodeId)
      );
    }
    
    if (content) {
      const childDivs = extractChildDivs(content);
      for (const childDiv of childDivs) {
        if (childDiv.trim()) {
          children.push(parseDiv(childDiv));
        }
      }
    }

    // If no children, add some placeholder content
    if (children.length === (nodeId ? 1 : 0)) {
      children.push(
        React.createElement('div', {
          key: 'placeholder',
          className: 'text-gray-400 text-xs italic text-center py-2'
        }, 'Empty div element')
      );
    }

    return React.createElement('div', props, ...children);
  };

  // Extract child div elements (simple parser)
  const extractChildDivs = (content: string): string[] => {
    const divs: string[] = [];
    let depth = 0;
    let current = '';
    let i = 0;
    
    while (i < content.length) {
      if (content.substring(i).startsWith('<div')) {
        if (depth === 0) {
          current = '';
        }
        depth++;
        current += '<div';
        i += 4;
      } else if (content.substring(i).startsWith('</div>')) {
        current += '</div>';
        depth--;
        if (depth === 0 && current.trim()) {
          divs.push(current.trim());
          current = '';
        }
        i += 6;
      } else {
        if (depth > 0) {
          current += content[i];
        }
        i++;
      }
    }
    
    return divs;
  };

  // Create a fallback visual representation when dynamic parsing fails
  const createFallbackComponent = (tsxContent: string, componentName: string): React.ComponentType => {
    const lines = tsxContent.split('\n').filter(line => line.trim());
    const hasDataNode = tsxContent.includes('data-node=');
    const hasFlexCol = tsxContent.includes('flex-col');
    
    const FallbackComponent = () => {
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
                  Contains nested div elements
                </div>
              </div>
              <div className="bg-gray-100 border border-gray-300 p-3 rounded">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-2"></div>
                    <div className="text-xs text-gray-600">Generated Component Structure</div>
                    <div className="text-xs text-gray-500 mt-1">className=&quot;flex flex-col&quot;</div>
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
    
    FallbackComponent.displayName = 'FallbackComponent';
    return FallbackComponent;
  };

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