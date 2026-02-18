import { useState, useEffect } from 'react'
import { fetchCategories, Category } from '../api/client'

interface CategoryTabsProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0)

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 h-8 w-20 bg-white/5 rounded-full animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1 -mx-1 px-1">
      {/* "All" tab */}
      <button
        onClick={() => onCategoryChange('')}
        className={`
          flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full
          text-sm font-medium transition-all duration-300
          ${
            activeCategory === ''
              ? 'bg-gradient-primary text-white shadow-md'
              : 'glass-dark text-zinc-400 hover:text-primary-300 hover:shadow-sm'
          }
        `}
      >
        <span>全部</span>
        <span
          className={`
            text-xs px-1.5 py-0.5 rounded-full
            ${activeCategory === '' ? 'bg-white/25 text-white' : 'bg-white/5 text-zinc-500'}
          `}
        >
          {totalCount}
        </span>
      </button>

      {/* Category tabs */}
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onCategoryChange(cat.name)}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full
            text-sm font-medium transition-all duration-300
            ${
              activeCategory === cat.name
                ? 'bg-gradient-primary text-white shadow-md'
                : 'glass-dark text-zinc-400 hover:text-primary-300 hover:shadow-sm'
            }
          `}
        >
          <span>{cat.name}</span>
          <span
            className={`
              text-xs px-1.5 py-0.5 rounded-full
              ${
                activeCategory === cat.name
                  ? 'bg-white/25 text-white'
                  : 'bg-white/5 text-zinc-500'
              }
            `}
          >
            {cat.count}
          </span>
        </button>
      ))}
    </div>
  )
}
