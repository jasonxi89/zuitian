import { useState } from 'react'

interface ChatMessageProps {
  content: string
  isUser: boolean
  isLoading?: boolean
}

export default function ChatMessage({ content, isUser, isLoading }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold text
      const parts = line.split(/(\*\*.*?\*\*)/g)
      const formatted = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })

      return (
        <span key={i}>
          {formatted}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-start">
        <div className="bubble-ai px-4 py-3 max-w-[80%]">
          <div className="flex items-center gap-1.5">
            <div className="loading-dot w-2 h-2 bg-primary-300 rounded-full"></div>
            <div className="loading-dot w-2 h-2 bg-primary-300 rounded-full"></div>
            <div className="loading-dot w-2 h-2 bg-primary-300 rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`
          relative max-w-[80%] px-4 py-3
          ${isUser ? 'bubble-user text-white' : 'bubble-ai text-gray-700'}
        `}
      >
        {/* Message content */}
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {formatContent(content)}
        </div>

        {/* Copy button for AI messages */}
        {!isUser && content && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-1 right-2 p-1 rounded-md
                       opacity-0 group-hover:opacity-100 transition-all duration-200
                       hover:bg-gray-100 text-gray-300 hover:text-primary-500"
            title="复制"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        )}

        {/* Copied feedback */}
        {copied && (
          <div className="absolute -top-6 right-0 toast-enter">
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
              已复制!
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
