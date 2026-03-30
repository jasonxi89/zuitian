import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Layout from '../../components/Layout'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('Layout', () => {
  it('renders navigation tabs', () => {
    render(
      <Layout currentPage="library" onPageChange={vi.fn()}>
        <div>content</div>
      </Layout>
    )
    expect(screen.getByText('话术库')).toBeInTheDocument()
    expect(screen.getByText('AI助手')).toBeInTheDocument()
    expect(screen.getByText('甜言蜜语')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <Layout currentPage="library" onPageChange={vi.fn()}>
        <div data-testid="child">child content</div>
      </Layout>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('calls onPageChange with "chat" when AI助手 tab is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Layout currentPage="library" onPageChange={onPageChange}>
        <div />
      </Layout>
    )
    await user.click(screen.getByText('AI助手'))
    expect(onPageChange).toHaveBeenCalledWith('chat')
  })

  it('calls onPageChange with "random" when 甜言蜜语 tab is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Layout currentPage="library" onPageChange={onPageChange}>
        <div />
      </Layout>
    )
    await user.click(screen.getByText('甜言蜜语'))
    expect(onPageChange).toHaveBeenCalledWith('random')
  })

  it('calls onPageChange with "library" when 话术库 tab is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Layout currentPage="chat" onPageChange={onPageChange}>
        <div />
      </Layout>
    )
    await user.click(screen.getByText('话术库'))
    expect(onPageChange).toHaveBeenCalledWith('library')
  })

  it('renders app title', () => {
    render(
      <Layout currentPage="library" onPageChange={vi.fn()}>
        <div />
      </Layout>
    )
    // Title uses gradient text; match partial text
    expect(screen.getByText(/嘴甜/)).toBeInTheDocument()
  })
})
