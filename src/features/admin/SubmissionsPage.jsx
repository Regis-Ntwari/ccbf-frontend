import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Alert from '@mui/material/Alert'
import { PageHeader } from '@/shared/components/PageHeader'
import { ErrorState, PageSkeleton } from '@/shared/components/States'

import { useDecidePrice, usePrices } from '@/features/catalogue/api'
import { PriceTable } from './PriceTable'

/** J7: submissions queue → verify/approve → flagged anomalies → publish. */
export function SubmissionsPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('pending')
  const [q, setQ] = useState('')
  const prices = usePrices({ status })
  const decide = useDecidePrice()
  const actions = useCallback(
    (r) =>
      r.status === 'rejected' ? null : (
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => decide.mutate({ id: r.id, decision: { decision: 'approve' } })}
            disabled={decide.isPending}
          >
            {t('admin.submissions.approve')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => decide.mutate({ id: r.id, decision: { decision: 'reject' } })}
            disabled={decide.isPending}
          >
            {t('admin.submissions.reject')}
          </Button>
        </Stack>
      ),
    [decide, t],
  )
  return (
    <Box>
      <PageHeader title={t('admin.submissions.title')} subtitle={t('admin.submissions.subtitle')} />
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, v) => v && setStatus(v)}>
          <ToggleButton value="pending">{t('admin.submissions.pending')}</ToggleButton>
          <ToggleButton value="flagged">{t('admin.submissions.flagged')}</ToggleButton>
          <ToggleButton value="rejected">{t('admin.submissions.rejected')}</ToggleButton>
        </ToggleButtonGroup>
        <TextField size="small" placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </Stack>
      {status === 'flagged' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('admin.submissions.flaggedHint')}
        </Alert>
      )}
      {decide.isError && <ErrorState error={decide.error} />}
      {prices.isPending && <PageSkeleton />}
      {prices.isError && <ErrorState error={prices.error} onRetry={() => void prices.refetch()} />}
      {prices.data && <PriceTable rows={prices.data} globalFilter={q} actions={actions} />}
    </Box>
  )
}
