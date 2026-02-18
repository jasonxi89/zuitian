import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Create clipboard mock as a persistent reference
const clipboardWriteText = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: clipboardWriteText },
  writable: true,
  configurable: true,
})

// Mock scrollIntoView (not implemented in jsdom)
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Clean up mocks between tests (clearAllMocks clears call history but keeps spies)
beforeEach(() => {
  vi.clearAllMocks()
  // Re-add implementations after clearAllMocks resets them
  clipboardWriteText.mockResolvedValue(undefined)
  vi.mocked(global.fetch).mockReset()
})
