import { useEffect, useMemo } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ThemeProvider, useColorScheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useTranslation } from 'react-i18next'
import { theme } from '@/shared/theme/theme'
import { PERSIST_MAX_AGE, queryClient, queryPersister } from './queryClient'
import { router } from './router'
import { useCurrentUser, useUiStore } from '@/shared/stores'
import { PwaBridge } from '@/pwa/PwaBridge'

/** Keeps MUI's colour scheme and i18next in sync with the persisted UI store. */
function UiSync() {
  const colorMode = useUiStore((s) => s.colorMode)
  const locale = useUiStore((s) => s.locale)
  const { setMode } = useColorScheme()
  const { i18n } = useTranslation()
  useEffect(() => setMode(colorMode), [colorMode, setMode])
  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale)
    document.documentElement.lang = locale
  }, [locale, i18n])
  return null
}

function RouterWithContext() {
  const user = useCurrentUser()
  const context = useMemo(() => ({ queryClient, auth: { user } }), [user])
  return <RouterProvider router={router} context={context} />
}

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: PERSIST_MAX_AGE,
        dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === 'success' },
      }}
    >
      <ThemeProvider theme={theme} defaultMode="system" noSsr>
        <CssBaseline enableColorScheme />
        <UiSync />
        <PwaBridge />
        <RouterWithContext />
      </ThemeProvider>
    </PersistQueryClientProvider>
  )
}
