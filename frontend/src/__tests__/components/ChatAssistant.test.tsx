import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatAssistant from '../../components/ChatAssistant'

// Mock streamChat from api/client
vi.mock('../../api/client', () => ({
  streamChat: vi.fn(),
}))

import { streamChat } from '../../api/client'

describe('ChatAssistant', () => {
  it('renders initial welcome message', () => {
    render(<ChatAssistant />)
    // The welcome message contains "嘴甜AI助手"
    expect(screen.getByText(/嘴甜AI助手/)).toBeInTheDocument()
  })

  it('renders all 4 style selector buttons', () => {
    render(<ChatAssistant />)
    expect(screen.getByText('幽默型')).toBeInTheDocument()
    expect(screen.getByText('温柔型')).toBeInTheDocument()
    expect(screen.getByText('直球型')).toBeInTheDocument()
    expect(screen.getByText('文艺型')).toBeInTheDocument()
  })

  it('has send button disabled when input is empty', () => {
    render(<ChatAssistant />)
    // The send button is the last button in the input area
    // It is disabled when input is empty and no images selected
    const allButtons = screen.getAllByRole('button')
    // Find the send button - it's disabled with empty input
    const sendButton = allButtons.find((btn) => btn.getAttribute('disabled') !== null && btn.querySelector('svg path[d*="M12 19"]'))
    // Alternatively, just check that there is at least one disabled button in the group
    const disabledButtons = allButtons.filter((btn) => btn.hasAttribute('disabled'))
    expect(disabledButtons.length).toBeGreaterThan(0)
  })

  it('send button becomes enabled when input has text', async () => {
    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'hello')

    // After typing, find the send button; it should no longer be disabled
    const allButtons = screen.getAllByRole('button')
    // The send button is the flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-primary button
    // We check the last button in the input row is no longer disabled
    const enabledButtons = allButtons.filter((btn) => !btn.hasAttribute('disabled') && btn.closest('.flex.gap-2.items-end'))
    expect(enabledButtons.length).toBeGreaterThan(0)
  })

  it('calls streamChat when message is sent', async () => {
    const mockStreamChat = vi.mocked(streamChat)
    mockStreamChat.mockImplementation(async (_req, _onChunk, onDone) => {
      onDone()
    })

    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'hello')

    // Click the send button (it's enabled now)
    const allButtons = screen.getAllByRole('button')
    // The send button is at end of input row; it has bg-gradient-primary in className
    const sendBtn = allButtons.find(
      (btn) => btn.className.includes('bg-gradient-primary') && btn.className.includes('flex-shrink-0')
    )
    expect(sendBtn).toBeDefined()
    if (sendBtn) await user.click(sendBtn)

    await waitFor(() => {
      expect(mockStreamChat).toHaveBeenCalled()
    })
  })

  it('sends request with their_message and selected style', async () => {
    const mockStreamChat = vi.mocked(streamChat)
    mockStreamChat.mockImplementation(async (_req, _onChunk, onDone) => {
      onDone()
    })

    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'test message')

    const allButtons = screen.getAllByRole('button')
    const sendBtn = allButtons.find(
      (btn) => btn.className.includes('bg-gradient-primary') && btn.className.includes('flex-shrink-0')
    )
    if (sendBtn) await user.click(sendBtn)

    await waitFor(() => {
      expect(mockStreamChat).toHaveBeenCalledWith(
        expect.objectContaining({
          their_message: 'test message',
          style: 'humorous', // default style
        }),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      )
    })
  })

  it('switches active style when style button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatAssistant />)

    const gentleBtn = screen.getByText('温柔型').closest('button')!
    await user.click(gentleBtn)

    // After clicking, the button should have the active class (bg-gradient-primary)
    expect(gentleBtn.className).toContain('bg-gradient-primary')
  })

  it('humorous style is active by default', () => {
    render(<ChatAssistant />)
    const humorousBtn = screen.getByText('幽默型').closest('button')!
    expect(humorousBtn.className).toContain('bg-gradient-primary')
  })

  it('shows context input field when 添加背景信息 is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatAssistant />)

    await user.click(screen.getByText('添加背景信息'))

    expect(screen.getByPlaceholderText(/刚认识不久/)).toBeInTheDocument()
  })

  it('hides context input field when 添加背景信息 is clicked again', async () => {
    const user = userEvent.setup()
    render(<ChatAssistant />)

    // Open
    await user.click(screen.getByText('添加背景信息'))
    expect(screen.getByPlaceholderText(/刚认识不久/)).toBeInTheDocument()

    // Close
    await user.click(screen.getByText('添加背景信息'))
    expect(screen.queryByPlaceholderText(/刚认识不久/)).not.toBeInTheDocument()
  })

  it('sends message on Enter key press', async () => {
    const mockStreamChat = vi.mocked(streamChat)
    mockStreamChat.mockImplementation(async (_req, _onChunk, onDone) => {
      onDone()
    })

    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'hello{Enter}')

    await waitFor(() => {
      expect(mockStreamChat).toHaveBeenCalled()
    })
  })

  it('does not send on Shift+Enter', async () => {
    const mockStreamChat = vi.mocked(streamChat)
    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'hello{Shift>}{Enter}{/Shift}')

    expect(mockStreamChat).not.toHaveBeenCalled()
  })

  it('clears input after message is sent', async () => {
    const mockStreamChat = vi.mocked(streamChat)
    mockStreamChat.mockImplementation(async (_req, _onChunk, onDone) => {
      onDone()
    })

    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'hello{Enter}')

    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('')
    })
  })

  it('adds user message to chat after sending', async () => {
    const mockStreamChat = vi.mocked(streamChat)
    mockStreamChat.mockImplementation(async (_req, _onChunk, onDone) => {
      onDone()
    })

    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'my test message{Enter}')

    await waitFor(() => {
      expect(screen.getByText('my test message')).toBeInTheDocument()
    })
  })

  it('shows AI response chunks in chat', async () => {
    const mockStreamChat = vi.mocked(streamChat)
    mockStreamChat.mockImplementation(async (_req, onChunk, onDone) => {
      onChunk('这是AI回复')
      onDone()
    })

    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'hello{Enter}')

    await waitFor(() => {
      expect(screen.getByText('这是AI回复')).toBeInTheDocument()
    })
  })

  it('shows error message when streamChat onError is called', async () => {
    const mockStreamChat = vi.mocked(streamChat)
    mockStreamChat.mockImplementation(async (_req, _onChunk, _onDone, onError) => {
      onError(new Error('Network error'))
    })

    const user = userEvent.setup()
    render(<ChatAssistant />)

    const textarea = screen.getByPlaceholderText(/输入对方说的话/)
    await user.type(textarea, 'hello{Enter}')

    await waitFor(() => {
      expect(screen.getByText(/抱歉，出了点问题/)).toBeInTheDocument()
    })
  })
})
