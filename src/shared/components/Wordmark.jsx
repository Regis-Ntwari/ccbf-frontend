import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { FONT_MONO } from '@/shared/theme/theme'
import { useConfig } from '@/features/config/api'

/** Text wordmark with a small drafting-style mark. */
export function Wordmark({ compact = false }) {
  const { t } = useTranslation()
  const config = useConfig()
  const b = config.data?.branding
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        aria-hidden
        sx={{
          width: 22,
          height: 22,
          border: '1.5px solid',
          borderColor: 'text.primary',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 4,
            borderTop: '1.5px solid',
            borderRight: '1.5px solid',
            borderColor: 'secondary.main',
          }}
        />
      </Box>
      <Box sx={{ lineHeight: 1 }}>
        <Typography component="span" sx={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', display: 'block' }}>
          {b?.shortName ?? 'CostBOQ'}
        </Typography>
        {!compact && (
          <Typography
            component="span"
            sx={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              color: 'text.secondary',
              textTransform: 'uppercase',
            }}
          >
            {t('shell.wordmark.estimating')} · {b?.region ?? 'Rwanda'}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
