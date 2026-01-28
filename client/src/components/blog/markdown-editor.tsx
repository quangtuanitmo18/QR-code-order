'use client'

import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

// Dynamically import react-markdown-editor-lite to avoid SSR issues
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false,
})

// Import editor styles
import 'react-markdown-editor-lite/lib/index.css'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  height?: number
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your blog post content in Markdown...',
  className,
  height = 500,
}: MarkdownEditorProps) {
  const handleEditorChange = ({ text }: { text: string; html: string }) => {
    onChange(text)
  }

  return (
    <div className={cn('w-full', className)}>
      <MdEditor
        value={value}
        style={{ height: `${height}px` }}
        renderHTML={(text) => (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {text}
          </ReactMarkdown>
        )}
        onChange={handleEditorChange}
        placeholder={placeholder}
        config={{
          view: {
            menu: true,
            md: true,
            html: true,
          },
          canView: {
            menu: true,
            md: true,
            html: true,
            fullScreen: true,
            hideMenu: false,
          },
        }}
      />
    </div>
  )
}
