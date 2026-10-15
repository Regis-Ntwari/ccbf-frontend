import { useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import { PageHeader } from '@/shared/components/PageHeader'
import { ErrorState, PageSkeleton } from '@/shared/components/States'
import { MaterialCategorySchema, PriceSubmissionSchema } from '@/shared/api/schemas'
import { usePrices, useSubmitPrice } from '@/features/catalogue/api'
import { useLocations } from '@/features/estimate/api'
import { PriceTable } from './PriceTable'

/** Global price database (Feature 9) with a "suggest a price" submission form. */
export function PricesPage() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const prices = usePrices({ status: 'approved', category: category || undefined })
  const locations = useLocations()
  const submit = useSubmitPrice()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ materialId: '', price: '', locationId: 'kigali', source: '', sourceDate: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState<string | null>(null)

  const send = () => {
    const parsed = PriceSubmissionSchema.safeParse({ ...form, price: Number(form.price) })
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check inputs')
    setError(null)
    submit.mutate(parsed.data, { onSuccess: () => { setOpen(false); setForm({ ...form, price: '', source: '' }) } })
  }

  return (
    <Box>
      <PageHeader title="Price database" subtitle="Approved prices with source, date and confidence. Stale = older than 90 days." actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Submit a price</Button>} />
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, mb: 2 }}>
        <TextField size="small" placeholder="Search material or ID" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 260 }} />
        <TextField size="small" select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All</MenuItem>
          {MaterialCategorySchema.options.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Stack>
      {prices.isPending && <PageSkeleton />}
      {prices.isError && <ErrorState error={prices.error} onRetry={() => void prices.refetch()} />}
      {prices.data && <PriceTable rows={prices.data} globalFilter={q} />}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Submit a price</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Material" value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
              {(prices.data ?? []).map((p) => <MenuItem key={p.id} value={p.materialId}>{p.materialId} · {p.name}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Price (RWF)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <TextField select label="Location" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              {(locations.data ?? []).map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
            </TextField>
            <TextField label="Source" placeholder="Supplier, quotation, receipt…" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            <TextField type="date" label="Date" value={form.sourceDate} onChange={(e) => setForm({ ...form, sourceDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            {error && <Alert severity="error">{error}</Alert>}
            {submit.isError && <ErrorState error={submit.error} />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={send} disabled={submit.isPending}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
