import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import type { EstimateParams } from '@/shared/api/schemas'
import { useCreateProject } from './api'
import { fieldError } from '@/shared/lib/form'

const schema = z.object({ name: z.string().min(2, 'Give the project a name') })

export function SaveProjectDialog({ open, onClose, params, estimateId }: { open: boolean; onClose: () => void; params: EstimateParams; estimateId: string }) {
  const navigate = useNavigate()
  const create = useCreateProject()
  const form = useForm({
    defaultValues: { name: '' },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const project = await create.mutateAsync({ name: value.name, params, fromEstimateId: estimateId })
      onClose()
      void navigate({ to: '/projects/$projectId', params: { projectId: project.id } })
    },
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
        <DialogTitle>Save as project</DialogTitle>
        <DialogContent>
          <form.Field name="name">
            {(field) => (
              <TextField
                autoFocus
                fullWidth
                margin="dense"
                label="Project name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.isTouched && Boolean(fieldError(field.state.meta.errors))}
                helperText={field.state.meta.isTouched ? fieldError(field.state.meta.errors) : ' '}
              />
            )}
          </form.Field>
          {create.isError && <Alert severity="error">{(create.error as Error).message}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" variant="contained" disabled={!canSubmit || isSubmitting}>
                Save
              </Button>
            )}
          </form.Subscribe>
        </DialogActions>
      </form>
    </Dialog>
  )
}
