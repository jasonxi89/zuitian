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
            className="flex-shrink-0 h-9 w-20 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1 -mx-1 px-1" role="tablist">
      {/* "All" tab */}
      <button
        role="tab"
        aria-selected={activeCategory === ''}
        onClick={() => onCategoryChange('')}
        className={`
          flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full
          text-sm font-medium transition-all duration-200
          ${
            activeCategory === ''
              ? 'bg-teal-600 text-white dark:bg-teal-700'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
          }
        `}
      >
        <span>全部</span>
        <span
          className={`
            text-xs px-1.5 py-0.5 rounded-full
            ${activeCategory === '' ? 'bg-teal-500/20 text-teal-100' : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}
          `}
        >
          {totalCount}
        </span>
      </button>

      {/* Category tabs */}
      {categories.map((cat) => (
        <button
          key={cat.name}
          role="tab"
          aria-selected={activeCategory === cat.name}
          onClick={() => onCategoryChange(cat.name)}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full
            text-sm font-medium transition-all duration-200
            ${
              activeCategory === cat.name
                ? 'bg-teal-600 text-white dark:bg-teal-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }
          `}
        >
          <span>{cat.name}</span>
          <span
            className={`
              text-xs px-1.5 py-0.5 rounded-full
              ${
                activeCategory === cat.name
                  ? 'bg-teal-500/20 text-teal-100'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
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
