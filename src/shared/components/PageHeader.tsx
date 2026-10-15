import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, actions, chips }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; chips?: ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h2" component="h1">
            {title}
          </Typography>
          {chips}
        </Stack>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {actions}
        </Stack>
      )}
    </Stack>
  )
}
