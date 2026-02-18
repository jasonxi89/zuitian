import { ReactNode } from 'react'

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
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky top navigation */}
      <nav className="sticky top-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          {/* Title bar */}
          <div className="flex items-center justify-center py-3">
            <h1 className="text-xl font-bold tracking-wide">
              <span className="text-gradient">嘴甜</span>
              <span className="text-zinc-500 text-sm ml-2 font-normal">最甜</span>
            </h1>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onPageChange(tab.key)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl
                  text-sm font-medium transition-all duration-300
                  ${
                    currentPage === tab.key
                      ? 'bg-primary-500/20 text-primary-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
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
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-8">
        {children}
      </main>
    </div>
  )
}
