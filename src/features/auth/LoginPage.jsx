import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import { RequestOtpSchema, VerifyOtpSchema } from '@/shared/api/schemas'
import { fieldError } from '@/shared/lib/form'
import { USE_MOCK } from '@/shared/api/client'
import { useRequestOtp, useVerifyOtp } from './api'

const DEMO = [
  'client@demo.rw',
  'architect@demo.rw',
  'qs@demo.rw',
  'contractor@demo.rw',
  'pm@demo.rw',
  'coadmin@demo.rw',
  'admin@demo.rw',
]

/** Email/phone OTP sign-in (Section 14.12). Two steps, both validated with Zod via TanStack Form. */
export function LoginPage({ redirect }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const request = useRequestOtp()
  const verify = useVerifyOtp()
  const [identifier, setIdentifier] = useState(null)

  const step1 = useForm({
    defaultValues: { identifier: '' },
    validators: { onSubmit: RequestOtpSchema },
    onSubmit: async ({ value }) => {
      await request.mutateAsync(value.identifier)
      setIdentifier(value.identifier)
    },
  })
  const step2 = useForm({
    defaultValues: { identifier: '', code: '' },
    validators: { onSubmit: VerifyOtpSchema },
    onSubmit: async ({ value }) => {
      await verify.mutateAsync({ identifier: identifier ?? value.identifier, code: value.code })
      void navigate({ to: redirect && redirect.startsWith('/') ? redirect : '/overview' })
    },
  })

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', pt: { xs: 2, md: 6 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          {t('nav.login')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('shell.login.intro')}
        </Typography>
        {!identifier ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void step1.handleSubmit()
            }}
          >
            <step1.Field name="identifier">
              {(field) => (
                <TextField
                  fullWidth
                  autoFocus
                  label={t('shell.login.identifier')}
                  autoComplete="username"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  error={Boolean(fieldError(field.state.meta.errors))}
                  helperText={fieldError(field.state.meta.errors) ?? ' '}
                />
              )}
            </step1.Field>
            {request.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {request.error.message}
              </Alert>
            )}
            <Button type="submit" variant="contained" fullWidth size="large" disabled={request.isPending}>
              {t('shell.login.sendCode')}
            </Button>
            {USE_MOCK && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('shell.login.demoAccounts')}
                </Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {DEMO.map((d) => (
                    <Chip key={d} size="small" label={d} onClick={() => step1.setFieldValue('identifier', d)} />
                  ))}
                </Stack>
              </Box>
            )}
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              step2.setFieldValue('identifier', identifier)
              void step2.handleSubmit()
            }}
          >
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('shell.login.codeSent', { identifier })} {request.data?.hint}
            </Alert>
            <step2.Field name="code">
              {(field) => (
                <TextField
                  fullWidth
                  autoFocus
                  label={t('shell.login.codeLabel')}
                  autoComplete="one-time-code"
                  slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 } }}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  error={Boolean(fieldError(field.state.meta.errors))}
                  helperText={fieldError(field.state.meta.errors) ?? ' '}
                />
              )}
            </step2.Field>
            {verify.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {verify.error.message}
              </Alert>
            )}
            <Stack direction="row" spacing={1}>
              <Button onClick={() => setIdentifier(null)}>{t('wizard.back')}</Button>
              <Button type="submit" variant="contained" fullWidth disabled={verify.isPending}>
                {t('shell.login.verify')}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  )
}
