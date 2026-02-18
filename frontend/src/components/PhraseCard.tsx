import { useState } from 'react'
import { Phrase } from '../api/client'

interface PhraseCardProps {
  phrase: Phrase
}

const categoryColors: Record<string, string> = {
  '开场白': 'bg-blue-100 text-blue-600',
  '幽默回复': 'bg-amber-100 text-amber-600',
  '土味情话': 'bg-rose-100 text-rose-600',
  '表白句子': 'bg-red-100 text-red-600',
  '暧昧升温': 'bg-purple-100 text-purple-600',
  '约会邀请': 'bg-teal-100 text-teal-600',
  '早安晚安': 'bg-orange-100 text-orange-600',
  '节日祝福': 'bg-pink-100 text-pink-600',
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || 'bg-gray-100 text-gray-600'
}

export default function PhraseCard({ phrase }: PhraseCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phrase.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement('textarea')
      textarea.value = phrase.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="glass-dark rounded-2xl p-4 card-hover relative group">
      {/* Content */}
      <p className="text-gray-700 text-[15px] leading-relaxed mb-3 pr-8">
        {phrase.content}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {/* Category badge */}
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryColor(phrase.category)}`}
        >
          {phrase.category}
        </span>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-lg
                   opacity-0 group-hover:opacity-100 transition-all duration-200
                   hover:bg-primary-50 text-gray-400 hover:text-primary-500"
        title="复制"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>

      {/* Copied toast */}
      {copied && (
        <div className="absolute -top-2 right-2 toast-enter">
          <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-full shadow-md">
            已复制!
          </span>
        </div>
      )}
    </div>
  )
}
