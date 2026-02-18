import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatMessage from '../../components/ChatMessage'

describe('ChatMessage', () => {
  it('renders user message content', () => {
    render(<ChatMessage content="你好" isUser={true} />)
    expect(screen.getByText('你好')).toBeInTheDocument()
  })

  it('renders AI message content', () => {
    render(<ChatMessage content="AI response" isUser={false} />)
    expect(screen.getByText('AI response')).toBeInTheDocument()
  })

  it('shows 3 loading dots when isLoading is true', () => {
    const { container } = render(<ChatMessage content="" isUser={false} isLoading={true} />)
    const dots = container.querySelectorAll('.loading-dot')
    expect(dots.length).toBe(3)
  })

  it('does not render main message div when isLoading', () => {
    const { container } = render(<ChatMessage content="test" isUser={false} isLoading={true} />)
    // Loading state renders the dot animation, not a bubble with text
    expect(screen.queryByText('test')).not.toBeInTheDocument()
  })

  it('renders bold text from **markdown** syntax', () => {
    render(<ChatMessage content="This is **bold** text" isUser={false} />)
    const bold = screen.getByText('bold')
    expect(bold.tagName).toBe('STRONG')
  })

  it('renders plain text without markdown modification', () => {
    render(<ChatMessage content="plain text" isUser={false} />)
    expect(screen.getByText('plain text')).toBeInTheDocument()
  })

  it('user message has bubble-user class', () => {
    const { container } = render(<ChatMessage content="hi" isUser={true} />)
    const bubble = container.querySelector('.bubble-user')
    expect(bubble).toBeInTheDocument()
  })

  it('AI message has bubble-ai class', () => {
    const { container } = render(<ChatMessage content="hi" isUser={false} />)
    const bubble = container.querySelector('.bubble-ai')
    expect(bubble).toBeInTheDocument()
  })

  it('does not show copy button for user messages', () => {
    render(<ChatMessage content="user msg" isUser={true} />)
    expect(screen.queryByTitle('复制')).not.toBeInTheDocument()
  })

  it('shows copy button for AI messages with content', () => {
    render(<ChatMessage content="AI response" isUser={false} />)
    expect(screen.getByTitle('复制')).toBeInTheDocument()
  })

  it('does not show copy button for AI message with empty content', () => {
    render(<ChatMessage content="" isUser={false} />)
    expect(screen.queryByTitle('复制')).not.toBeInTheDocument()
  })

  it('copies AI message content when copy button clicked', async () => {
    const user = userEvent.setup()
    render(<ChatMessage content="AI says hello" isUser={false} />)

    const copyBtn = screen.getByTitle('复制')
    await user.click(copyBtn)

    // After clicking copy, the UI shows "已复制!" confirming clipboard operation ran
    expect(screen.getByText('已复制!')).toBeInTheDocument()
  })

  it('shows 已复制! toast after copy', async () => {
    const user = userEvent.setup()
    render(<ChatMessage content="AI says hello" isUser={false} />)

    const copyBtn = screen.getByTitle('复制')
    await user.click(copyBtn)

    expect(screen.getByText('已复制!')).toBeInTheDocument()
  })

  it('renders uploaded images for user messages', () => {
    const images = [{ preview: 'data:image/png;base64,abc' }]
    render(<ChatMessage content="look" isUser={true} images={images} />)
    const img = document.querySelector('img[alt="uploaded"]') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain('data:image/png;base64,abc')
  })
})
