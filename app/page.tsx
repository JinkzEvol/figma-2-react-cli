"use client";
import Image from "next/image";
import DesignPreviewCardInteractive from "./components/DesignPreviewCardInteractive";
import { GeneratedPreview } from "./lib/generated-content";
import { useEffect, useState } from "react";

export default function Home() {
  const [allPreviews, setAllPreviews] = useState<GeneratedPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreviews() {
      try {
        const response = await fetch('/api/generated-previews');
        if (response.ok) {
          const previews = await response.json();
          setAllPreviews(previews);
        }
      } catch (error) {
        console.error('Failed to fetch previews:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreviews();
  }, []);

  return (
    <div className="font-sans min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <Image
            className="dark:invert mx-auto mb-8"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Figma → React CLI</h1>
          <p className="text-gray-600 max-w-4xl mx-auto">
            Convert Figma designs to deterministic, pixel-perfect React components with Tailwind CSS. 
            Browse all your generated components below.
          </p>
          
          <div className="mt-8 text-sm text-gray-500">
            Showing {allPreviews.length} processed design{allPreviews.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">
              <svg className="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-gray-600">Loading generated components...</p>
          </div>
        ) : allPreviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Design Previews</h3>
            <p className="text-gray-600 mb-8">
              Run the Figma → React converter to generate your first component preview.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
              <ol className="font-mono list-inside list-decimal text-sm/6 text-left">
                <li className="mb-2 tracking-[-.01em]">
                  Set your{" "}
                  <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
                    FIGMA_TOKEN
                  </code>{" "}
                  environment variable.
                </li>
                <li className="tracking-[-.01em]">
                  Run the generator to create your first component preview.
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allPreviews.map((preview, index) => (
              <DesignPreviewCardInteractive 
                key={`${preview.outputPath}-${preview.versionDir}`} 
                preview={preview} 
                rank={index + 1}
              />
            ))}
          </div>
        )}

        <div className="mt-16 flex gap-4 items-center justify-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://github.com/JinkzEvol/figma-2-react-cli"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/docs"
          >
            Read Documentation
          </a>
        </div>
      </main>

      <footer className="bg-gray-50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-[24px] flex-wrap items-center justify-center">
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="/about"
            >
              <Image
                aria-hidden
                src="/file.svg"
                alt="File icon"
                width={16}
                height={16}
              />
              Learn more
            </a>
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="/examples"
            >
              <Image
                aria-hidden
                src="/window.svg"
                alt="Window icon"
                width={16}
                height={16}
              />
              Examples
            </a>
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/globe.svg"
                alt="Globe icon"
                width={16}
                height={16}
              />
              Go to nextjs.org →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
