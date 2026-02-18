import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock child components to simplify
vi.mock('../components/PhraseLibrary', () => ({
  default: () => <div data-testid="phrase-library">PhraseLibrary</div>,
}))
vi.mock('../components/ChatAssistant', () => ({
  default: () => <div data-testid="chat-assistant">ChatAssistant</div>,
}))
vi.mock('../components/RandomPickup', () => ({
  default: () => <div data-testid="random-pickup">RandomPickup</div>,
}))
vi.mock('../components/Layout', () => ({
  default: ({ children, onPageChange }: any) => (
    <div>
      <button onClick={() => onPageChange('chat')}>chat</button>
      <button onClick={() => onPageChange('random')}>random</button>
      <button onClick={() => onPageChange('library')}>library</button>
      {children}
    </div>
  ),
}))

describe('App', () => {
  it('renders PhraseLibrary by default', () => {
    render(<App />)
    expect(screen.getByTestId('phrase-library')).toBeInTheDocument()
  })

  it('switches to ChatAssistant when page changes to chat', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('chat'))
    expect(screen.getByTestId('chat-assistant')).toBeInTheDocument()
  })

  it('switches to RandomPickup when page changes to random', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('random'))
    expect(screen.getByTestId('random-pickup')).toBeInTheDocument()
  })

  it('switches back to PhraseLibrary when page changes to library', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('chat'))
    await user.click(screen.getByText('library'))
    expect(screen.getByTestId('phrase-library')).toBeInTheDocument()
  })
})
