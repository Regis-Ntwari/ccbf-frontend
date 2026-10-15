import type { ErrorComponentProps } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import { ApiError } from '@/shared/api/client'

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const message = error instanceof ApiError ? error.message : (error as Error)?.message ?? 'Unknown error'
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
            Retry
          </Button>
        }
      >
        <AlertTitle>Something went wrong</AlertTitle>
        {message}
      </Alert>
    </Container>
  )
}
