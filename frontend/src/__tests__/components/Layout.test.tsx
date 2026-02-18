import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Layout from '../../components/Layout'

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
