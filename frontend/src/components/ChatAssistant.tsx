import { useState, useRef, useEffect } from 'react'
import { streamChat, type ImageContent } from '../api/client'
import ChatMessage from './ChatMessage'

interface SelectedImage {
  data: string
  media_type: string
  preview: string
}

interface Message {
  id: number
  content: string
  isUser: boolean
  isLoading?: boolean
  images?: { preview: string }[]
}

const STYLES = [
  { key: 'humorous', label: '幽默型', emoji: '😄' },
  { key: 'gentle', label: '温柔型', emoji: '🥰' },
  { key: 'direct', label: '直球型', emoji: '🎯' },
  { key: 'literary', label: '文艺型', emoji: '📝' },
]

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      content: '你好呀~ 我是你的撩妹AI助手! 💕\n\n告诉我她说了什么，我来帮你想高情商回复~\n\n你可以选择不同的回复风格，还可以添加背景信息让回复更精准哦!',
      isUser: false,
    },
  ])
  const [input, setInput] = useState('')
  const [context, setContext] = useState('')
  const [showContext, setShowContext] = useState(false)
  const [style, setStyle] = useState('humorous')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nextIdRef = useRef(1)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('图片不能超过5MB')
        return
      }
      if (selectedImages.length >= 3) {
        alert('最多上传3张图片')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const preview = result
        // Strip "data:image/xxx;base64," prefix
        const commaIndex = result.indexOf(',')
        const data = result.slice(commaIndex + 1)
        const media_type = file.type || 'image/jpeg'

        setSelectedImages((prev) => {
          if (prev.length >= 3) return prev
          return [...prev, { data, media_type, preview }]
        })
      }
      reader.readAsDataURL(file)
    })

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if ((!trimmed && selectedImages.length === 0) || isStreaming) return

    const userMsgId = nextIdRef.current++
    const aiMsgId = nextIdRef.current++

    // Capture current images for the message
    const currentImages = selectedImages.map((img) => ({ preview: img.preview }))
    const imagesToSend: ImageContent[] | undefined =
      selectedImages.length > 0
        ? selectedImages.map((img) => ({ data: img.data, media_type: img.media_type }))
        : undefined

    // Add user message
    const userMessage: Message = {
      id: userMsgId,
      content: trimmed,
      isUser: true,
      images: currentImages.length > 0 ? currentImages : undefined,
    }

    // Add AI placeholder message
    const aiMessage: Message = {
      id: aiMsgId,
      content: '',
      isUser: false,
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, aiMessage])
    setInput('')
    setSelectedImages([])
    setIsStreaming(true)

    // Auto-resize textarea back to default
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    let accumulated = ''

    await streamChat(
      {
        their_message: trimmed,
        style,
        context: context || undefined,
        images: imagesToSend,
      },
      // onChunk
      (text: string) => {
        accumulated += text
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, content: accumulated, isLoading: false }
              : msg,
          ),
        )
      },
      // onDone
      () => {
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, isLoading: false }
              : msg,
          ),
        )
      },
      // onError
      (error: Error) => {
        console.error('Chat error:', error)
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content: '抱歉，出了点问题~ 请稍后再试 😅',
                  isLoading: false,
                }
              : msg,
          ),
        )
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Style selector */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {STYLES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStyle(s.key)}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-300
              ${
                style === s.key
                  ? 'bg-gradient-primary text-white shadow-md scale-105'
                  : 'glass-dark text-gray-600 hover:text-primary-600 hover:shadow-sm'
              }
            `}
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto chat-scroll rounded-2xl glass p-4 space-y-3 mb-3">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            content={msg.content}
            isUser={msg.isUser}
            isLoading={msg.isLoading}
            images={msg.images}
          />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Context input (collapsible) */}
      <div className="mb-2">
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs text-gray-400 hover:text-primary-500 transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-3 h-3 transition-transform ${showContext ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          添加背景信息
        </button>
        {showContext && (
          <input
            type="text"
            placeholder="例如: 刚认识不久, 聊了一周了, 她是同事..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="mt-1.5 w-full px-3 py-2 rounded-xl glass-dark text-sm text-gray-600
                       placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200
                       transition-all duration-300"
          />
        )}
      </div>

      {/* Image preview */}
      {selectedImages.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {selectedImages.map((img, i) => (
            <div key={i} className="relative group/img">
              <img
                src={img.preview}
                alt="preview"
                className="w-16 h-16 object-cover rounded-xl border-2 border-primary-200"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white
                           rounded-full flex items-center justify-center text-xs
                           opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || selectedImages.length >= 3}
          className="flex-shrink-0 w-12 h-12 rounded-2xl glass-dark
                     text-gray-400 hover:text-primary-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 hover:scale-105
                     flex items-center justify-center"
          title="上传聊天截图"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={selectedImages.length > 0 ? "可选：补充说明..." : "输入她说的话，或上传聊天截图..."}
            rows={1}
            className="w-full px-4 py-3 rounded-2xl glass-dark text-gray-700
                       placeholder-gray-400 resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary-300
                       transition-all duration-300"
            style={{ maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={(!input.trim() && selectedImages.length === 0) || isStreaming}
          className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-primary
                     text-white shadow-md hover:shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 hover:scale-105
                     flex items-center justify-center"
        >
          {isStreaming ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
