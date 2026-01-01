/**
 * Markdown preview component with KaTeX math rendering
 */

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useFileStore } from '../../stores/fileStore';

export function MarkdownPreview() {
  const { content, currentFile } = useFileStore();

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 border-l border-gray-200">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No preview available</p>
          <p className="text-sm">Select a file to see the preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-gray-200">
      <div className="max-w-4xl mx-auto p-8">
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Custom code block styling
              code({ node, inline, className, children, ...props }) {
                return inline ? (
                  <code
                    className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className={`${className} block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              // Custom heading styling
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 border-b pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-900">
                  {children}
                </h3>
              ),
              // Custom link styling
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              // Custom blockquote styling
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4">
                  {children}
                </blockquote>
              ),
              // Custom list styling
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 my-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 my-4">
                  {children}
                </ol>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
