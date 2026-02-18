import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhraseLibrary from '../../components/PhraseLibrary'

const mockPhrases = [
  { id: 1, content: '你好呀', category: '开场白', is_pickup_line: false },
  { id: 2, content: '你是我的宇宙', category: '土味情话', is_pickup_line: true },
  { id: 3, content: '晚安', category: '早安晚安', is_pickup_line: false },
]

const mockCategories = [
  { name: '开场白', count: 1 },
  { name: '土味情话', count: 1 },
]

function setupFetchMock(phrases = mockPhrases, categories = mockCategories) {
  vi.mocked(global.fetch).mockImplementation((url: any) => {
    const urlStr = url.toString()
    if (urlStr.includes('/api/phrases/categories')) {
      return Promise.resolve({ ok: true, json: async () => categories } as Response)
    }
    return Promise.resolve({ ok: true, json: async () => phrases } as Response)
  })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('PhraseLibrary', () => {
  it('renders search input', () => {
    setupFetchMock()
    render(<PhraseLibrary />)
    expect(screen.getByPlaceholderText('搜索话术...')).toBeInTheDocument()
  })

  it('loads and displays phrases', async () => {
    setupFetchMock()
    render(<PhraseLibrary />)
    await waitFor(() => expect(screen.getByText('你好呀')).toBeInTheDocument())
    expect(screen.getByText('你是我的宇宙')).toBeInTheDocument()
    expect(screen.getByText('晚安')).toBeInTheDocument()
  })

  it('shows empty state when no phrases returned', async () => {
    vi.mocked(global.fetch).mockImplementation((url: any) => {
      const urlStr = url.toString()
      if (urlStr.includes('categories')) {
        return Promise.resolve({ ok: true, json: async () => [] } as Response)
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response)
    })
    render(<PhraseLibrary />)
    await waitFor(() => expect(screen.getByText('暂无话术数据')).toBeInTheDocument())
  })

  it('shows "没有找到匹配的话术" when search yields no results', async () => {
    setupFetchMock()
    const user = userEvent.setup()
    render(<PhraseLibrary />)

    // Wait for initial load
    await waitFor(() => screen.getByText('你好呀'))

    // Mock empty results for search
    vi.mocked(global.fetch).mockImplementation((url: any) => {
      const urlStr = url.toString()
      if (urlStr.includes('categories')) {
        return Promise.resolve({ ok: true, json: async () => mockCategories } as Response)
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response)
    })

    const searchInput = screen.getByPlaceholderText('搜索话术...')
    await user.type(searchInput, '不存在的话术')

    // 300ms debounce fires naturally; waitFor polls until text appears
    await waitFor(
      () => expect(screen.getByText('没有找到匹配的话术')).toBeInTheDocument(),
      { timeout: 3000 },
    )
  })

  it('searches phrases on input with debounce', async () => {
    setupFetchMock()
    const user = userEvent.setup()
    render(<PhraseLibrary />)

    const searchInput = screen.getByPlaceholderText('搜索话术...')
    await user.type(searchInput, '你好')

    // Debounce is 300ms; waitFor will poll until search call appears
    await waitFor(
      () => {
        const calls = vi.mocked(global.fetch).mock.calls
        const searchCalls = calls.filter((c) => {
          const url = c[0]?.toString() || ''
          return url.includes('search=')
        })
        expect(searchCalls.length).toBeGreaterThan(0)
      },
      { timeout: 3000 },
    )
  })

  it('shows clear button when search input has text', async () => {
    setupFetchMock()
    const user = userEvent.setup()
    render(<PhraseLibrary />)

    const searchInput = screen.getByPlaceholderText('搜索话术...')
    await user.type(searchInput, 'test')
    expect((searchInput as HTMLInputElement).value).toBe('test')
  })

  it('clears search when clear button is clicked', async () => {
    setupFetchMock()
    const user = userEvent.setup()
    render(<PhraseLibrary />)

    const searchInput = screen.getByPlaceholderText('搜索话术...')
    await user.type(searchInput, 'hello')
    expect((searchInput as HTMLInputElement).value).toBe('hello')

    const clearBtn = document.querySelector('button.absolute.inset-y-0') as HTMLButtonElement
    if (clearBtn) {
      await user.click(clearBtn)
      expect((searchInput as HTMLInputElement).value).toBe('')
    }
  })

  it('shows load more button when exactly PAGE_SIZE (20) items returned', async () => {
    const manyPhrases = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      content: `话术${i + 1}`,
      category: '开场白',
      is_pickup_line: false,
    }))
    vi.mocked(global.fetch).mockImplementation((url: any) => {
      const urlStr = url.toString()
      if (urlStr.includes('categories')) {
        return Promise.resolve({ ok: true, json: async () => [] } as Response)
      }
      return Promise.resolve({ ok: true, json: async () => manyPhrases } as Response)
    })
    render(<PhraseLibrary />)
    await waitFor(() => expect(screen.getByText('加载更多')).toBeInTheDocument())
  })

  it('does not show load more when fewer than PAGE_SIZE items returned', async () => {
    setupFetchMock()
    render(<PhraseLibrary />)
    await waitFor(() => screen.getByText('你好呀'))
    expect(screen.queryByText('加载更多')).not.toBeInTheDocument()
  })

  it('fetches with category param when category changes', async () => {
    setupFetchMock()
    const user = userEvent.setup()
    render(<PhraseLibrary />)

    // Wait for category tabs to load, then click the first "开场白" (the tab, not the badge)
    await waitFor(() => screen.getAllByText('开场白'))
    await user.click(screen.getAllByText('开场白')[0])

    await waitFor(() => {
      const calls = vi.mocked(global.fetch).mock.calls
      const categoryFiltered = calls.some((c) => {
        const url = c[0]?.toString() || ''
        return url.includes('category=')
      })
      expect(categoryFiltered).toBe(true)
    })
  })

  it('initially fetches phrases on mount', async () => {
    setupFetchMock()
    render(<PhraseLibrary />)
    await waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalled()
    })
  })
})
