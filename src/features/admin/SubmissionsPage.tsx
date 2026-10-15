import { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Alert from '@mui/material/Alert'
import { PageHeader } from '@/shared/components/PageHeader'
import { ErrorState, PageSkeleton } from '@/shared/components/States'
import type { PriceRecord } from '@/shared/api/schemas'
import { useDecidePrice, usePrices } from '@/features/catalogue/api'
import { PriceTable } from './PriceTable'

/** J7: submissions queue → verify/approve → flagged anomalies → publish. */
export function SubmissionsPage() {
  const [status, setStatus] = useState<'pending' | 'flagged' | 'rejected'>('pending')
  const [q, setQ] = useState('')
  const prices = usePrices({ status })
  const decide = useDecidePrice()
  const actions = useCallback(
    (r: PriceRecord) =>
      r.status === 'rejected' ? null : (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" variant="contained" color="success" onClick={() => decide.mutate({ id: r.id, decision: { decision: 'approve' } })} disabled={decide.isPending}>Approve</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => decide.mutate({ id: r.id, decision: { decision: 'reject' } })} disabled={decide.isPending}>Reject</Button>
        </Stack>
      ),
    [decide],
  )
  return (
    <Box>
      <PageHeader title="Price submissions" subtitle="Approving a price publishes a new version and supersedes the current approved record for that material and location." />
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, v: typeof status | null) => v && setStatus(v)}>
          <ToggleButton value="pending">Pending</ToggleButton>
          <ToggleButton value="flagged">Flagged anomalies</ToggleButton>
          <ToggleButton value="rejected">Rejected</ToggleButton>
        </ToggleButtonGroup>
        <TextField size="small" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </Stack>
      {status === 'flagged' && <Alert severity="warning" sx={{ mb: 2 }}>Flagged prices deviate more than 25 % from the current approved price. Verify with a second source before approving.</Alert>}
      {decide.isError && <ErrorState error={decide.error} />}
      {prices.isPending && <PageSkeleton />}
      {prices.isError && <ErrorState error={prices.error} onRetry={() => void prices.refetch()} />}
      {prices.data && <PriceTable rows={prices.data} globalFilter={q} actions={actions} />}
    </Box>
  )
}
