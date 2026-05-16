'use client';

import ReactMarkdown from 'react-markdown';

import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface Props {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <div
      className={`prose prose-blue prose-code:before:content-none prose-code:after:content-none prose-code:font-normal max-w-none ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
