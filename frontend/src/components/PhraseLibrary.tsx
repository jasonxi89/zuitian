import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchPhrases, Phrase } from '../api/client'
import CategoryTabs from './CategoryTabs'
import PhraseCard from './PhraseCard'

const PAGE_SIZE = 20

export default function PhraseLibrary() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [category, setCategory] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [search])

  // Reset and load when category or search changes
  useEffect(() => {
    setPhrases([])
    setOffset(0)
    setHasMore(true)
    loadPhrases(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, debouncedSearch])

  const loadPhrases = useCallback(
    async (currentOffset: number, reset = false) => {
      setLoading(true)
      try {
        const data = await fetchPhrases({
          category: category || undefined,
          search: debouncedSearch || undefined,
          offset: currentOffset,
          limit: PAGE_SIZE,
        })
        if (reset) {
          setPhrases(data)
        } else {
          setPhrases((prev) => [...prev, ...data])
        }
        setHasMore(data.length === PAGE_SIZE)
        setOffset(currentOffset + data.length)
      } catch (err) {
        console.error('Failed to load phrases:', err)
      } finally {
        setLoading(false)
      }
    },
    [category, debouncedSearch],
  )

  const handleLoadMore = () => {
    loadPhrases(offset)
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="搜索话术..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl glass-dark
                     text-zinc-200 placeholder-zinc-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500/50
                     transition-all duration-300"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Category tabs */}
      <CategoryTabs activeCategory={category} onCategoryChange={setCategory} />

      {/* Phrases grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {phrases.map((phrase) => (
          <PhraseCard key={phrase.id} phrase={phrase} />
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && phrases.length === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="glass-dark rounded-2xl p-4 animate-pulse"
            >
              <div className="h-4 bg-white/5 rounded-full w-3/4 mb-3"></div>
              <div className="h-4 bg-white/5 rounded-full w-1/2 mb-3"></div>
              <div className="h-3 bg-white/5 rounded-full w-1/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && phrases.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💭</div>
          <p className="text-zinc-400 text-lg">
            {debouncedSearch ? '没有找到匹配的话术' : '暂无话术数据'}
          </p>
          <p className="text-zinc-600 text-sm mt-2">
            {debouncedSearch ? '试试换个关键词搜索' : '请先添加一些话术到数据库'}
          </p>
        </div>
      )}

      {/* Load more button */}
      {hasMore && phrases.length > 0 && (
        <div className="text-center pt-2 pb-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-8 py-2.5 rounded-full bg-gradient-primary text-white
                       font-medium shadow-md hover:shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300 hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                加载中...
              </span>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}

      {/* Loading spinner for load more */}
      {loading && phrases.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-1">
            <div className="loading-dot w-2 h-2 bg-primary-400 rounded-full"></div>
            <div className="loading-dot w-2 h-2 bg-primary-400 rounded-full"></div>
            <div className="loading-dot w-2 h-2 bg-primary-400 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  )
}
