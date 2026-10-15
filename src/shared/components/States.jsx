import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/client'

export function LoadingState({ label, inline = false }) {
  const { t } = useTranslation()
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: inline ? 2 : 8 }}
      role="status"
      aria-live="polite"
    >
      <CircularProgress size={22} />
      <Typography color="text.secondary">{label ?? t('common.loading')}</Typography>
    </Box>
  )
}

export function PageSkeleton() {
  return (
    <Stack spacing={2} sx={{ py: 2 }} aria-busy="true">
      <Skeleton variant="text" width="40%" height={40} />
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={240} />
    </Stack>
  )
}

export function ErrorState({ error, onRetry }) {
  const { t } = useTranslation()
  const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : t('common.error')
  const details = error instanceof ApiError && Array.isArray(error.details) ? error.details : null
  return (
    <Alert
      severity="error"
      sx={{ my: 2 }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        ) : undefined
      }
    >
      {message}
      {details && details.length > 0 && (
        <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
          {details.slice(0, 5).map((d, i) => (
            <li key={i}>{typeof d === 'string' ? d : JSON.stringify(d)}</li>
          ))}
        </Box>
      )}
    </Alert>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  )
}
