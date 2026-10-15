import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

import { BoqOverrideInputSchema } from '@/shared/api/schemas'
import { fieldError } from '@/shared/lib/form'

/** Edit quantity / rate / waste for one BOQ item. A reason is mandatory (audit trail). */
export function OverrideDialog({ item, onClose, onSubmit, pending, error }) {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: {
      qty: String(item.override?.qty ?? item.qty),
      rate: String(item.override?.rate ?? item.rate),
      wastePct: String(item.wastePct),
      reason: item.override?.reason ?? '',
    },
    validators: {
      onSubmit: ({ value }) => {
        const r = BoqOverrideInputSchema.safeParse({
          qty: Number(value.qty),
          rate: Number(value.rate),
          wastePct: Number(value.wastePct),
          reason: value.reason,
        })
        if (r.success) return undefined
        return { fields: Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message])) }
      },
    },
    onSubmit: ({ value }) =>
      onSubmit({
        qty: Number(value.qty),
        rate: Number(value.rate),
        wastePct: Number(value.wastePct),
        reason: value.reason,
      }),
  })
  const num = (name, label) => (
    <form.Field name={name}>
      {(field) => (
        <TextField
          type="number"
          label={label}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          error={Boolean(fieldError(field.state.meta.errors))}
          helperText={fieldError(field.state.meta.errors) ?? ' '}
          fullWidth
        />
      )}
    </form.Field>
  )
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <DialogTitle>{t('workspace.boq.overrideTitle', { code: item.code })}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {item.description} · {item.unit}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {num('qty', t('workspace.boq.quantityUnit', { unit: item.unit }))}
            {num('rate', t('workspace.boq.rateUnit', { unit: item.unit }))}
            {num('wastePct', t('workspace.boq.wastePct'))}
          </Stack>
          <form.Field name="reason">
            {(field) => (
              <TextField
                label={t('workspace.boq.reason')}
                multiline
                minRows={2}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={Boolean(fieldError(field.state.meta.errors))}
                helperText={fieldError(field.state.meta.errors) ?? t('workspace.boq.reasonHint')}
                fullWidth
              />
            )}
          </form.Field>
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {t('workspace.boq.saveOverride')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
