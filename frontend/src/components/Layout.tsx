import { ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'

type Page = 'library' | 'chat' | 'random'

interface LayoutProps {
  currentPage: Page
  onPageChange: (page: Page) => void
  children: ReactNode
}

const tabs: { key: Page; label: string; icon: string }[] = [
  { key: 'library', label: '话术库', icon: '💬' },
  { key: 'chat', label: 'AI助手', icon: '🤖' },
  { key: 'random', label: '甜言蜜语', icon: '🎲' },
]

export default function Layout({ currentPage, onPageChange, children }: LayoutProps) {
  const { isDark, toggle } = useTheme()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky top navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-4">
          {/* Title bar */}
          <div className="flex items-center justify-between py-3">
            <div className="w-10" />
            <h1 className="text-xl font-bold tracking-wide">
              <span className="font-display text-2xl font-bold text-teal-700 dark:text-teal-400">嘴甜</span>
              <span className="text-stone-400 dark:text-stone-500 text-sm ml-2 font-normal">aka 最舔🐶</span>
            </h1>
            <button
              onClick={toggle}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-200"
              aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 pb-2" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={currentPage === tab.key}
                onClick={() => onPageChange(tab.key)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl
                  text-sm font-medium transition-all duration-200
                  ${
                    currentPage === tab.key
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main role="main" className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-8">
        {children}
      </main>
    </div>
  )
}
