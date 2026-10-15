import Alert from '@mui/material/Alert'
import Collapse from '@mui/material/Collapse'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import { useTranslation } from 'react-i18next'
import { usePwaStore } from '@/shared/stores'

export function OfflineBanner() {
  const { t } = useTranslation()
  const online = usePwaStore((s) => s.online)
  return (
    <Collapse in={!online}>
      <Alert severity="warning" icon={<WifiOffIcon fontSize="inherit" />} sx={{ borderRadius: 0 }}>
        {t('common.offline')}
      </Alert>
    </Collapse>
  )
}
