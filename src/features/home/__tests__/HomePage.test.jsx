import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { ThemeProvider } from '@mui/material/styles'
import '@/shared/i18n'
import { theme } from '@/shared/theme/theme'
import { HomePage } from '../HomePage'

function renderWithProviders(ui) {
  const root = createRootRoute({ component: () => ui })
  const index = createRoute({ getParentRoute: () => root, path: '/', component: () => null })
  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  it('shows the step estimator with the seven typologies and a sign-in-gated save path', async () => {
    renderWithProviders(<HomePage />)
    expect(await screen.findByRole('heading', { name: /what do you want to build/i })).toBeInTheDocument()
    for (const label of ['House', 'Apartments', 'Shop', 'Office', 'Hotel', 'School', 'Other']) {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument()
    }
    expect(screen.getByText(/Site & size/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })
})
