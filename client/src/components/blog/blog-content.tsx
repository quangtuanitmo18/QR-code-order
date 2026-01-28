'use client'

import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface BlogContentProps {
  content: string
  className?: string
}

export default function BlogContent({ content, className }: BlogContentProps) {
  return (
    <div
      className={cn(
        'prose prose-lg max-w-none dark:prose-invert',
        'prose-headings:font-bold prose-headings:text-foreground',
        'prose-p:leading-relaxed prose-p:text-foreground',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-strong:font-semibold prose-strong:text-foreground',
        'prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-primary',
        'prose-pre:border prose-pre:bg-muted',
        'prose-blockquote:border-l-primary prose-blockquote:bg-muted/50',
        'prose-img:rounded-lg prose-img:shadow-md',
        'prose-ol:list-decimal prose-ul:list-disc',
        'prose-li:marker:text-primary',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
