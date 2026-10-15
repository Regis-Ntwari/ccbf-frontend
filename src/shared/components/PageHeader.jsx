import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

/** Page header: mono eyebrow, title, subtitle, contextual actions, hairline rule. */
export function PageHeader({ eyebrow, title, subtitle, actions, chips }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        alignItems: { md: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
        pb: 2,
        mb: 3,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {eyebrow}
          </Typography>
        )}
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h2" component="h1">
            {title}
          </Typography>
          {chips}
        </Stack>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  )
}
