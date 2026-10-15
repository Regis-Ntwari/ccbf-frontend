import { useRegisterSW } from 'virtual:pwa-register/react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { useTranslation } from 'react-i18next'

/** "New version available" and "ready to work offline" toasts (registerType: prompt). */
export function ServiceWorkerPrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for updates every hour while the app stays open.
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })
  return (
    <>
      <Snackbar open={needRefresh} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert
          severity="info"
          onClose={() => setNeedRefresh(false)}
          action={
            <Button color="inherit" size="small" onClick={() => void updateServiceWorker(true)}>
              {t('common.reload')}
            </Button>
          }
        >
          {t('common.update')}
        </Alert>
      </Snackbar>
      <Snackbar
        open={offlineReady}
        autoHideDuration={4000}
        onClose={() => setOfflineReady(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setOfflineReady(false)}>
          {t('shell.pwa.offlineReady')}
        </Alert>
      </Snackbar>
    </>
  )
}
