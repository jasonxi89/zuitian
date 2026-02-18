import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RandomPickup from '../../components/RandomPickup'

const mockPhrase = {
  id: 5,
  content: '你是我的宇宙，永远在我的心里旋转',
  category: '土味情话',
  is_pickup_line: true,
}

afterEach(() => {
  vi.useRealTimers()
})

describe('RandomPickup', () => {
  it('shows initial prompt before first pick', () => {
    render(<RandomPickup />)
    expect(screen.getByText('点击下方按钮')).toBeInTheDocument()
  })

  it('shows hint text on initial render', () => {
    render(<RandomPickup />)
    expect(screen.getByText('获取一条土味情话~')).toBeInTheDocument()
  })

  it('shows "来一条" button initially', () => {
    render(<RandomPickup />)
    expect(screen.getByText('来一条')).toBeInTheDocument()
  })

  it('fetches and displays a random phrase', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhrase,
    } as Response)

    const user = userEvent.setup()
    render(<RandomPickup />)

    await user.click(screen.getByText('来一条'))

    // Component uses setTimeout 300ms before showing phrase
    await waitFor(
      () => {
        expect(screen.getByText('你是我的宇宙，永远在我的心里旋转')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('shows "再来一条" after first pick', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhrase,
    } as Response)

    const user = userEvent.setup()
    render(<RandomPickup />)
    await user.click(screen.getByText('来一条'))

    // Component uses setTimeout 600ms before resetting loading state
    await waitFor(
      () => {
        expect(screen.getByText('再来一条')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('shows error message on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response)

    const user = userEvent.setup()
    render(<RandomPickup />)
    await user.click(screen.getByText('来一条'))

    await waitFor(
      () => {
        expect(screen.getByText('获取失败，请稍后再试~')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('calls fetchRandomPhrase with 土味情话 category', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhrase,
    } as Response)

    const user = userEvent.setup()
    render(<RandomPickup />)
    await user.click(screen.getByText('来一条'))

    await waitFor(
      () => {
        const calls = vi.mocked(global.fetch).mock.calls
        expect(calls.length).toBeGreaterThan(0)
        const url = calls[0][0]?.toString() || ''
        expect(url).toContain('%E5%9C%9F%E5%91%B3%E6%83%85%E8%AF%9D')
      },
      { timeout: 2000 },
    )
  })

  it('has "每次都是随机的哦~" hint text', () => {
    render(<RandomPickup />)
    expect(screen.getByText('每次都是随机的哦~')).toBeInTheDocument()
  })
})
