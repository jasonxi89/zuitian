const BASE_URL = ''

export interface Phrase {
  id: number
  content: string
  category: string
  tags?: string
  is_pickup_line: boolean
  created_at?: string
}

export interface PhraseParams {
  category?: string
  search?: string
  offset?: number
  limit?: number
}

export interface Category {
  name: string
  count: number
}

export interface ChatRequest {
  their_message: string
  style?: string
  context?: string
}

export async function fetchPhrases(params: PhraseParams = {}): Promise<Phrase[]> {
  const searchParams = new URLSearchParams()
  if (params.category) searchParams.set('category', params.category)
  if (params.search) searchParams.set('search', params.search)
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset))
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))

  const query = searchParams.toString()
  const url = `${BASE_URL}/api/phrases${query ? `?${query}` : ''}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch phrases: ${response.statusText}`)
  }
  return response.json()
}

export async function fetchRandomPhrase(category?: string): Promise<Phrase> {
  const searchParams = new URLSearchParams()
  if (category) searchParams.set('category', category)

  const query = searchParams.toString()
  const url = `${BASE_URL}/api/phrases/random${query ? `?${query}` : ''}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch random phrase: ${response.statusText}`)
  }
  return response.json()
}

export async function fetchCategories(): Promise<Category[]> {
  const url = `${BASE_URL}/api/phrases/categories`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`)
  }
  return response.json()
}

export async function streamChat(
  request: ChatRequest,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        onDone()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              onChunk(parsed.content)
            }
          } catch {
            // If not JSON, treat as plain text
            if (data) {
              onChunk(data)
            }
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}
