import { useRouter } from '@tanstack/react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/client'

export function RouteError({ error, reset }) {
  const { t } = useTranslation()
  const router = useRouter()
  const message = error instanceof ApiError ? error.message : (error?.message ?? t('shell.unknownError'))
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              reset()
              void router.invalidate()
            }}
          >
            {t('common.retry')}
          </Button>
        }
      >
        <AlertTitle>{t('common.error')}</AlertTitle>
        {message}
      </Alert>
    </Container>
  )
}
