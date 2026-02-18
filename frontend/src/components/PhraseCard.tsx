import { useState } from 'react'
import { Phrase } from '../api/client'

interface PhraseCardProps {
  phrase: Phrase
}

const categoryColors: Record<string, string> = {
  '开场白': 'bg-blue-500/15 text-blue-400',
  '幽默回复': 'bg-amber-500/15 text-amber-400',
  '土味情话': 'bg-rose-500/15 text-rose-400',
  '表白句子': 'bg-red-500/15 text-red-400',
  '暧昧升温': 'bg-purple-500/15 text-purple-400',
  '约会邀请': 'bg-teal-500/15 text-teal-400',
  '早安晚安': 'bg-orange-500/15 text-orange-400',
  '节日祝福': 'bg-pink-500/15 text-pink-400',
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || 'bg-zinc-500/15 text-zinc-400'
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
      <p className="text-zinc-200 text-[15px] leading-relaxed mb-3 pr-8">
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
                   hover:bg-white/10 text-zinc-500 hover:text-primary-400"
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
