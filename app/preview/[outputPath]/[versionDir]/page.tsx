import Link from "next/link";
import { notFound } from "next/navigation";
import { getLatestVersion } from "../../../lib/generated-content";
import CodeActions from "../../../components/CodeActions";

interface PreviewPageProps {
  params: Promise<{
    outputPath: string;
    versionDir: string;
  }>;
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function getOutputDisplayName(outputPath: string): string {
  return outputPath
    .replace(/^generated-/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { outputPath, versionDir } = await params;
  
  const decodedOutputPath = decodeURIComponent(outputPath);
  const decodedVersionDir = decodeURIComponent(versionDir);
  
  const preview = await getLatestVersion(decodedOutputPath);
  
  if (!preview || preview.versionDir !== decodedVersionDir) {
    notFound();
  }
  
  const displayName = getOutputDisplayName(preview.outputPath);
  const layerCount = preview.summaryData?.layerCount || 'Unknown';
  const warningCount = preview.summaryData?.warnings?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Home
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {displayName} Preview
                </h1>
                <p className="text-sm text-gray-500">
                  Version {preview.versionDir}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Generated
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Component Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                React Component Preview
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-white rounded-lg shadow-sm border p-6 inline-block">
                    <div className="text-gray-600 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {preview.baseComponent}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Interactive rendering coming soon
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Sidebar */}
          <div className="space-y-6">
            
            {/* Component Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Component Details
              </h3>
              
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{preview.baseComponent}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Generated</dt>
                  <dd className="text-sm text-gray-900">{formatTimestamp(preview.runTimestamp)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Version</dt>
                  <dd className="text-sm font-mono text-gray-900">{preview.versionDir}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Layers</dt>
                  <dd className="text-sm text-gray-900">{layerCount}</dd>
                </div>
                {warningCount > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Warnings</dt>
                    <dd className="text-sm text-amber-600">{warningCount}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Code Preview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Source Code
              </h3>
              
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{preview.tsxContent}</code>
                </pre>
              </div>
              
              <CodeActions code={preview.tsxContent} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}