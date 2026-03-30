import { useState } from 'react'
import { Phrase } from '../api/client'

interface PhraseCardProps {
  phrase: Phrase
}

const categoryColors: Record<string, string> = {
  '开场白': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  '幽默回复': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '土味情话': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  '表白句子': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  '暧昧升温': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  '约会邀请': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  '早安晚安': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  '节日祝福': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  '高甜语录': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  '反差萌': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  '深夜emo': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  '神回复': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-400'
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
    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-stone-900/50 relative">
      {/* Content */}
      <p className="text-stone-700 dark:text-stone-200 text-[15px] leading-relaxed mb-3 pr-8">
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
        className="absolute top-3 right-3 p-2.5 rounded-lg
                   transition-all duration-200
                   hover:bg-stone-100 dark:hover:bg-stone-700
                   text-stone-400 hover:text-teal-600
                   dark:text-stone-500 dark:hover:text-teal-400"
        title="复制"
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="absolute -top-2 right-2 animate-slide-up">
          <span className="bg-green-600 dark:bg-green-500 text-white text-xs px-2.5 py-1 rounded-full shadow-md">
            已复制!
          </span>
        </div>
      )}
    </div>
  )
}
