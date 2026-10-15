import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'

import { BoqCustomItemInputSchema, BoqUnitSchema } from '@/shared/api/schemas'
import { fieldError } from '@/shared/lib/form'
import { FONT_MONO } from '@/shared/theme/theme'

/** Add a construction activity to a work section (quantity, unit, rate). */
export function AddItemDialog({ bills, defaultBill, onClose, onSubmit, pending, error }) {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: {
      billCode: defaultBill,
      description: '',
      trade: 'Custom',
      unit: 'm²',
      qty: '',
      rate: '',
      wastePct: '0',
    },
    validators: {
      onSubmit: ({ value }) => {
        const r = BoqCustomItemInputSchema.safeParse({
          ...value,
          qty: Number(value.qty),
          rate: Number(value.rate),
          wastePct: Number(value.wastePct),
        })
        return r.success
          ? undefined
          : { fields: Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message])) }
      },
    },
    onSubmit: ({ value }) =>
      onSubmit({ ...value, qty: Number(value.qty), rate: Number(value.rate), wastePct: Number(value.wastePct) }),
  })
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <DialogTitle>{t('workspace.boq.addActivity')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <form.Field name="billCode">
              {(f) => (
                <TextField
                  select
                  label={t('workspace.boq.workSection')}
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value)}
                >
                  {bills.map((b) => (
                    <MenuItem key={b.code} value={b.code}>
                      <span style={{ fontFamily: FONT_MONO, marginRight: 8 }}>{b.code}</span>
                      {b.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </form.Field>
            <form.Field name="description">
              {(f) => (
                <TextField
                  label={t('workspace.boq.description')}
                  autoFocus
                  value={f.state.value}
                  onBlur={f.handleBlur}
                  onChange={(e) => f.handleChange(e.target.value)}
                  error={Boolean(fieldError(f.state.meta.errors))}
                  helperText={fieldError(f.state.meta.errors) ?? ' '}
                />
              )}
            </form.Field>
            <Stack direction="row" spacing={1}>
              <form.Field name="trade">
                {(f) => (
                  <TextField
                    label={t('workspace.boq.trade')}
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                )}
              </form.Field>
              <form.Field name="unit">
                {(f) => (
                  <TextField
                    select
                    label={t('workspace.boq.unit')}
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    sx={{ width: 110 }}
                  >
                    {BoqUnitSchema.options.map((u) => (
                      <MenuItem key={u} value={u}>
                        {u}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </form.Field>
            </Stack>
            <Stack direction="row" spacing={1}>
              <form.Field name="qty">
                {(f) => (
                  <TextField
                    type="number"
                    label={t('workspace.boq.quantity')}
                    value={f.state.value}
                    onBlur={f.handleBlur}
                    onChange={(e) => f.handleChange(e.target.value)}
                    error={Boolean(fieldError(f.state.meta.errors))}
                    helperText={fieldError(f.state.meta.errors) ?? ' '}
                    slotProps={{ input: { sx: { fontFamily: FONT_MONO } } }}
                    fullWidth
                  />
                )}
              </form.Field>
              <form.Field name="rate">
                {(f) => (
                  <TextField
                    type="number"
                    label={t('workspace.boq.rateRwf')}
                    value={f.state.value}
                    onBlur={f.handleBlur}
                    onChange={(e) => f.handleChange(e.target.value)}
                    error={Boolean(fieldError(f.state.meta.errors))}
                    helperText={fieldError(f.state.meta.errors) ?? ' '}
                    slotProps={{ input: { sx: { fontFamily: FONT_MONO } } }}
                    fullWidth
                  />
                )}
              </form.Field>
              <form.Field name="wastePct">
                {(f) => (
                  <TextField
                    type="number"
                    label={t('workspace.boq.wastePct')}
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    slotProps={{ input: { sx: { fontFamily: FONT_MONO } } }}
                    sx={{ width: 120 }}
                  />
                )}
              </form.Field>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {t('workspace.boq.addActivity')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
