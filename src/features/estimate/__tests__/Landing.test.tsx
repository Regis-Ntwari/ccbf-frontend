import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { ThemeProvider } from '@mui/material/styles'
import '@/shared/i18n'
import { theme } from '@/shared/theme/theme'
import { Landing } from '../Landing'

function renderWithProviders(ui: React.ReactNode) {
  const root = createRootRoute({ component: () => ui })
  const index = createRoute({ getParentRoute: () => root, path: '/', component: () => null })
  const router = createRouter({ routeTree: root.addChildren([index]), history: createMemoryHistory({ initialEntries: ['/'] }) })
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={theme}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RouterProvider router={router as any} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('Landing', () => {
  it('asks "What do you want to build?" and offers the seven typologies', async () => {
    renderWithProviders(<Landing />)
    expect(await screen.findByRole('heading', { name: /what do you want to build/i })).toBeInTheDocument()
    for (const label of ['House', 'Apartments', 'Shop', 'Office', 'Hotel', 'School', 'Other']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: /get my budget/i })).toBeDisabled()
  })
})
