import Button from '@mui/material/Button'
import InstallMobileIcon from '@mui/icons-material/InstallMobile'
import { useTranslation } from 'react-i18next'
import { usePwaStore } from '@/shared/stores'

/** Shown only when the browser offers installation and the app is not yet installed. */
export function InstallButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const { t } = useTranslation()
  const installEvent = usePwaStore((s) => s.installEvent)
  const installed = usePwaStore((s) => s.installed)
  const setInstallEvent = usePwaStore((s) => s.setInstallEvent)
  if (installed || !installEvent) return null
  return (
    <Button
      fullWidth={fullWidth}
      variant="outlined"
      size="small"
      startIcon={<InstallMobileIcon />}
      onClick={async () => {
        await installEvent.prompt()
        const { outcome } = await installEvent.userChoice
        if (outcome === 'accepted') setInstallEvent(null)
      }}
    >
      {t('common.install')}
    </Button>
  )
}
