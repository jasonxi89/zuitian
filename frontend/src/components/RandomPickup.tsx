import { useState, useCallback } from 'react'
import { fetchRandomPhrase, Phrase } from '../api/client'

export default function RandomPickup() {
  const [phrase, setPhrase] = useState<Phrase | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRandomPhrase = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setIsFlipping(true)
    setError(null)

    try {
      const data = await fetchRandomPhrase('土味情话')
      // Wait for flip animation midpoint before updating content
      setTimeout(() => {
        setPhrase(data)
      }, 300)
    } catch (err) {
      console.error('Failed to fetch random phrase:', err)
      setError('获取失败，请稍后再试~')
      setIsFlipping(false)
    } finally {
      setTimeout(() => {
        setIsFlipping(false)
        setLoading(false)
      }, 600)
    }
  }, [loading])

  const handleCopy = async () => {
    if (!phrase) return
    try {
      await navigator.clipboard.writeText(phrase.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb absolute top-[10%] left-[10%] w-32 h-32 bg-primary-500/20" style={{ animationDelay: '0s' }} />
        <div className="glow-orb absolute top-[25%] right-[15%] w-24 h-24 bg-accent-400/15" style={{ animationDelay: '1s' }} />
        <div className="glow-orb absolute bottom-[30%] left-[20%] w-20 h-20 bg-primary-400/15" style={{ animationDelay: '2s' }} />
        <div className="glow-orb absolute top-[55%] right-[10%] w-28 h-28 bg-primary-600/10" style={{ animationDelay: '1.5s' }} />
        <div className="glow-orb absolute bottom-[15%] right-[25%] w-24 h-24 bg-accent-500/10" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Card */}
      <div className="flip-card w-full max-w-sm mb-8 relative z-10">
        <div
          className={`flip-card-inner ${isFlipping ? 'flipped' : ''}`}
          style={{ minHeight: '200px' }}
        >
          <div className="glass-dark rounded-3xl p-8 shadow-xl w-full glow-border">
            {phrase ? (
              <div className="text-center relative">
                {/* Quote marks */}
                <div className="text-5xl text-accent-400 leading-none mb-2">"</div>

                {/* Content */}
                <p className="text-lg text-zinc-200 leading-relaxed font-medium px-2">
                  {phrase.content}
                </p>

                {/* Bottom quote */}
                <div className="text-5xl text-accent-400 leading-none mt-2 rotate-180">"</div>

                {/* Category */}
                <div className="mt-3">
                  <span className="text-xs px-3 py-1 rounded-full bg-primary-500/15 text-primary-300 font-medium">
                    {phrase.category}
                  </span>
                </div>

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full
                             text-sm text-zinc-500 hover:text-primary-400
                             hover:bg-white/5 transition-all duration-200"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-500">已复制!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-6xl mb-4 animate-bounce-slow">✨</div>
                <p className="text-zinc-300 text-lg">
                  点击下方按钮
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  获取一条甜言蜜语~
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 text-rose-400 text-sm toast-enter">
          {error}
        </div>
      )}

      {/* Random button */}
      <button
        onClick={getRandomPhrase}
        disabled={loading}
        className="relative z-10 group px-8 py-4 rounded-full bg-gradient-primary
                   text-white text-lg font-bold shadow-xl
                   hover:shadow-2xl hover:scale-110
                   disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
                   transition-all duration-300
                   active:scale-95"
      >
        <span className="flex items-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              翻牌中...
            </>
          ) : (
            <>
              <span className="text-xl group-hover:animate-bounce">🎲</span>
              {phrase ? '再来一条' : '来一条'}
            </>
          )}
        </span>
      </button>

      {/* Hint text */}
      <p className="mt-4 text-zinc-600 text-xs relative z-10">
        每次都是随机的哦~
      </p>
    </div>
  )
}
