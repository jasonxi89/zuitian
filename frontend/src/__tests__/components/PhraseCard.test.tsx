import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhraseCard from '../../components/PhraseCard'

const mockPhrase = {
  id: 1,
  content: '你好，很高兴认识你',
  category: '开场白',
  is_pickup_line: false,
}

describe('PhraseCard', () => {
  it('renders phrase content', () => {
    render(<PhraseCard phrase={mockPhrase} />)
    expect(screen.getByText('你好，很高兴认识你')).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<PhraseCard phrase={mockPhrase} />)
    expect(screen.getByText('开场白')).toBeInTheDocument()
  })

  it('has a copy button', () => {
    render(<PhraseCard phrase={mockPhrase} />)
    // The copy button has title="复制"
    const copyBtn = screen.getByTitle('复制')
    expect(copyBtn).toBeInTheDocument()
  })

  it('copies content to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup()
    render(<PhraseCard phrase={mockPhrase} />)

    const copyBtn = screen.getByTitle('复制')
    await user.click(copyBtn)

    // After clicking copy, the UI shows "已复制!" confirming the clipboard operation ran
    expect(screen.getByText('已复制!')).toBeInTheDocument()
  })

  it('shows copied toast after copy', async () => {
    const user = userEvent.setup()
    render(<PhraseCard phrase={mockPhrase} />)

    const copyBtn = screen.getByTitle('复制')
    await user.click(copyBtn)

    expect(screen.getByText('已复制!')).toBeInTheDocument()
  })

  it('applies correct category color for known categories', () => {
    const { container } = render(<PhraseCard phrase={mockPhrase} />)
    const badge = screen.getByText('开场白')
    // Known category color: bg-blue-500/15 text-blue-400
    expect(badge.className).toContain('bg-blue-500/15')
  })

  it('applies fallback color for unknown categories', () => {
    const unknownPhrase = { ...mockPhrase, category: '未知分类' }
    render(<PhraseCard phrase={unknownPhrase} />)
    const badge = screen.getByText('未知分类')
    expect(badge.className).toContain('bg-zinc-500/15')
  })
})
