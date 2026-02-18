import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTabs from '../../components/CategoryTabs'

const mockCategories = [
  { name: '开场白', count: 25 },
  { name: '土味情话', count: 30 },
]

describe('CategoryTabs', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockCategories,
    } as Response)
  })

  it('renders all categories tab after loading', async () => {
    render(<CategoryTabs activeCategory="" onCategoryChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('全部')).toBeInTheDocument())
  })

  it('renders loaded categories', async () => {
    render(<CategoryTabs activeCategory="" onCategoryChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('开场白')).toBeInTheDocument())
    expect(screen.getByText('土味情话')).toBeInTheDocument()
  })

  it('renders category counts', async () => {
    render(<CategoryTabs activeCategory="" onCategoryChange={vi.fn()} />)
    await waitFor(() => screen.getByText('25'))
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('renders total count in all-categories tab', async () => {
    render(<CategoryTabs activeCategory="" onCategoryChange={vi.fn()} />)
    await waitFor(() => screen.getByText('全部'))
    // total = 25 + 30 = 55
    expect(screen.getByText('55')).toBeInTheDocument()
  })

  it('calls onCategoryChange when a category tab is clicked', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()
    render(<CategoryTabs activeCategory="" onCategoryChange={onCategoryChange} />)
    await waitFor(() => screen.getByText('开场白'))
    await user.click(screen.getByText('开场白'))
    expect(onCategoryChange).toHaveBeenCalledWith('开场白')
  })

  it('calls onCategoryChange with empty string for all tab', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()
    render(<CategoryTabs activeCategory="开场白" onCategoryChange={onCategoryChange} />)
    await waitFor(() => screen.getByText('全部'))
    await user.click(screen.getByText('全部'))
    expect(onCategoryChange).toHaveBeenCalledWith('')
  })

  it('shows loading skeleton initially', () => {
    // Keep fetch pending so loading state is visible
    vi.mocked(global.fetch).mockReturnValueOnce(new Promise(() => {}))
    const { container } = render(<CategoryTabs activeCategory="" onCategoryChange={vi.fn()} />)
    // Loading shows animate-pulse divs
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('handles fetch error gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    } as Response)
    // Should not throw; shows "全部" with 0 total
    render(<CategoryTabs activeCategory="" onCategoryChange={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('全部')).toBeInTheDocument())
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
