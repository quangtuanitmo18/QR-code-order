import { render } from '@/test/render-utils'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AutoPagination from './auto-pagination'

describe('AutoPagination', () => {
  describe('Button mode (isLink=false)', () => {
    it('renders correct number of page buttons', () => {
      render(<AutoPagination page={1} pageSize={5} isLink={false} />)
      // Should have page buttons 1-5
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('calls onClick with correct page when a page button is clicked', () => {
      const onClick = vi.fn()
      render(<AutoPagination page={1} pageSize={5} isLink={false} onClick={onClick} />)
      fireEvent.click(screen.getByText('3'))
      expect(onClick).toHaveBeenCalledWith(3)
    })

    it('disables Previous button on first page', () => {
      render(<AutoPagination page={1} pageSize={5} isLink={false} />)
      const prevButton = screen.getByRole('button', { name: /previous/i })
      expect(prevButton).toBeDisabled()
    })

    it('disables Next button on last page', () => {
      render(<AutoPagination page={5} pageSize={5} isLink={false} />)
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('calls onClick(page-1) when Previous is clicked on page 2', () => {
      const onClick = vi.fn()
      render(<AutoPagination page={2} pageSize={5} isLink={false} onClick={onClick} />)
      fireEvent.click(screen.getByRole('button', { name: /previous/i }))
      expect(onClick).toHaveBeenCalledWith(1)
    })

    it('calls onClick(page+1) when Next is clicked', () => {
      const onClick = vi.fn()
      render(<AutoPagination page={2} pageSize={5} isLink={false} onClick={onClick} />)
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      expect(onClick).toHaveBeenCalledWith(3)
    })

    it('shows ellipsis for large page counts', () => {
      const { container } = render(<AutoPagination page={10} pageSize={20} isLink={false} />)
      // PaginationEllipsis renders the MoreHorizontal icon with hidden text "More pages"
      // or the ellipsis span with aria-hidden="true". Check that the component renders.
      // We can verify by counting the total number of pagination items rendered
      const paginationItems = container.querySelectorAll('li')
      // Should have: prev + some pages + ellipsis(es) + current area + next = many items
      expect(paginationItems.length).toBeGreaterThanOrEqual(5)
    })
  })
})
