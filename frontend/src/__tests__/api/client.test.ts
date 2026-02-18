import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPhrases, fetchRandomPhrase, fetchCategories, streamChat } from '../../api/client'

describe('fetchPhrases', () => {
  it('calls correct URL with no params', async () => {
    const mockFetch = vi.mocked(global.fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response)

    await fetchPhrases()
    expect(mockFetch).toHaveBeenCalledWith('/api/phrases')
  })

  it('includes category param', async () => {
    const mockFetch = vi.mocked(global.fetch)
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)

    await fetchPhrases({ category: '开场白' })
    expect(mockFetch).toHaveBeenCalledWith('/api/phrases?category=%E5%BC%80%E5%9C%BA%E7%99%BD')
  })

  it('includes search param', async () => {
    const mockFetch = vi.mocked(global.fetch)
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)

    await fetchPhrases({ search: 'hello' })
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('search=hello')
  })

  it('includes offset and limit params', async () => {
    const mockFetch = vi.mocked(global.fetch)
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)

    await fetchPhrases({ offset: 20, limit: 10 })
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('offset=20')
    expect(url).toContain('limit=10')
  })

  it('throws on non-ok response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response)

    await expect(fetchPhrases()).rejects.toThrow('Failed to fetch phrases')
  })

  it('returns parsed JSON data', async () => {
    const mockData = [{ id: 1, content: '你好', category: '开场白', is_pickup_line: false }]
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response)

    const result = await fetchPhrases()
    expect(result).toEqual(mockData)
  })
})

describe('fetchRandomPhrase', () => {
  it('calls correct URL without category', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, content: '随机', category: '土味情话', is_pickup_line: true }),
    } as Response)

    await fetchRandomPhrase()
    expect(vi.mocked(global.fetch)).toHaveBeenCalledWith('/api/phrases/random')
  })

  it('includes category param', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, content: '随机', category: '土味情话', is_pickup_line: true }),
    } as Response)

    await fetchRandomPhrase('土味情话')
    const url = vi.mocked(global.fetch).mock.calls[0][0] as string
    expect(url).toContain('category=')
  })

  it('throws on non-ok response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response)

    await expect(fetchRandomPhrase()).rejects.toThrow('Failed to fetch random phrase')
  })

  it('returns parsed JSON data', async () => {
    const mockPhrase = { id: 5, content: '你是我的宇宙', category: '土味情话', is_pickup_line: true }
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhrase,
    } as Response)

    const result = await fetchRandomPhrase()
    expect(result).toEqual(mockPhrase)
  })
})

describe('fetchCategories', () => {
  it('calls correct URL', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response)

    await fetchCategories()
    expect(vi.mocked(global.fetch)).toHaveBeenCalledWith('/api/phrases/categories')
  })

  it('throws on non-ok response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    } as Response)

    await expect(fetchCategories()).rejects.toThrow('Failed to fetch categories')
  })

  it('returns parsed JSON data', async () => {
    const mockCategories = [{ name: '开场白', count: 10 }]
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    } as Response)

    const result = await fetchCategories()
    expect(result).toEqual(mockCategories)
  })
})

describe('streamChat', () => {
  it('calls onError on non-ok response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response)

    const onError = vi.fn()
    await streamChat({ their_message: 'hi' }, vi.fn(), vi.fn(), onError)
    expect(onError).toHaveBeenCalled()
  })

  it('calls onError when no response body', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      body: null,
    } as Response)

    const onError = vi.fn()
    await streamChat({ their_message: 'hi' }, vi.fn(), vi.fn(), onError)
    expect(onError).toHaveBeenCalled()
  })

  it('calls onError on fetch failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

    const onError = vi.fn()
    await streamChat({ their_message: 'hi' }, vi.fn(), vi.fn(), onError)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('sends POST request with correct headers', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'error',
    } as Response)

    await streamChat({ their_message: 'hi', style: 'humorous' }, vi.fn(), vi.fn(), vi.fn())

    expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('humorous'),
      })
    )
  })

  it('sends request body with their_message', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'error',
    } as Response)

    await streamChat({ their_message: 'test message' }, vi.fn(), vi.fn(), vi.fn())

    const callArgs = vi.mocked(global.fetch).mock.calls[0]
    const body = JSON.parse(callArgs[1]?.body as string)
    expect(body.their_message).toBe('test message')
  })
})
