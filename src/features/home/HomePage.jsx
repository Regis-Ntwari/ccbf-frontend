import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { HomeEstimator } from './HomeEstimator'
import { FONT_MONO } from '@/shared/theme/theme'
import { useConfig } from '@/features/config/api'
import { PageSkeleton } from '@/shared/components/States'
import { estimateApi } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/format'

const Band = ({ children, tone = 'default', sx }) => (
  <Box
    component="section"
    sx={{
      bgcolor: tone === 'secondary' ? 'surface.secondary' : 'background.default',
      borderBottom: 1,
      borderColor: 'divider',
      ...sx,
    }}
  >
    <Box sx={{ px: { xs: 2, md: 4, xl: 6 }, py: { xs: 4, md: 6 } }}>{children}</Box>
  </Box>
)

/** Live worked example: a real engine run for the configured sample building. */
function ExampleSheet({ config }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const ex = config.homepage.example
  const sample = useQuery({
    queryKey: ['estimates', 'example', ex],
    queryFn: () =>
      estimateApi.run({
        typology: ex.typology,
        locationId: ex.locationId,
        gfa: ex.gfa,
        storeys: ex.storeys,
        bedrooms: 3,
        bathrooms: 2,
        rooms: { garage: false, office: false, store: false, separateKitchen: false },
        quality: ex.quality,
        elementOverrides: {},
        features: [],
        site: { ownsLand: null, plotSizeM2: null, sloping: 'unknown' },
        budget: null,
        targetCompletionMonths: null,
        requestedClass: 1,
      }),
    staleTime: 5 * 60_000,
  })
  const e = sample.data
  const typeLabel = config.typologies.find((t) => t.id === ex.typology)?.label ?? ex.typology
  const locationLabel = config.locations.find((l) => l.id === ex.locationId)?.name ?? ex.locationId
  return (
    <Box
      sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', p: { xs: 2, md: 3 }, position: 'relative' }}
    >
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: 'secondary.main' }} />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
        <Typography variant="overline" color="text.secondary">
          {t('estimate.home.exampleEyebrow')}
        </Typography>
        <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: 'text.secondary' }}>
          {e ? `L${e.estimateClass} · ${e.rulesVersion}` : '…'}
        </Typography>
      </Stack>
      <Typography variant="h5">
        {typeLabel} · {locationLabel} · {ex.gfa} m² ·{' '}
        {t(ex.storeys === 1 ? 'estimate.floors_one' : 'estimate.floors_other', { n: ex.storeys })} ·{' '}
        {config.qualities.find((q) => q.id === ex.quality)?.label}
      </Typography>
      {e ? (
        <>
          <Typography
            sx={{ fontFamily: FONT_MONO, fontSize: { xs: 24, md: 30 }, fontWeight: 500, mt: 1.5, lineHeight: 1.1 }}
          >
            {formatMoney(e.total.low, 'RWF', lang, { compact: true })}{' '}
            <Box component="span" sx={{ color: 'text.disabled' }}>
              –
            </Box>{' '}
            {formatMoney(e.total.high, 'RWF', lang, { compact: true })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('estimate.home.exampleSummary', {
              mid: formatMoney(e.total.mid, 'RWF', lang),
              perM2: formatMoney(e.costPerM2, 'RWF', lang),
              months: e.durationMonths,
            })}
          </Typography>
          <Table size="small" sx={{ '& td': { px: 0, py: 0.5, borderBottomStyle: 'dashed' } }}>
            <TableBody>
              {e.phases
                .filter((p) => p.amount > 0)
                .slice(0, 6)
                .map((p) => (
                  <TableRow key={p.code}>
                    <TableCell sx={{ fontFamily: FONT_MONO, color: 'text.secondary', width: 36 }}>{p.code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell align="right" sx={{ width: 140, whiteSpace: 'nowrap' }}>
                      <Box
                        sx={{
                          display: 'inline-block',
                          height: 6,
                          width: `${Math.max(4, Math.min(72, p.pct * 2.5))}px`,
                          bgcolor: 'text.primary',
                          verticalAlign: 'middle',
                          mr: 1,
                        }}
                      />
                      <Box component="span" sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>
                        {p.pct} %
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            {t('estimate.home.exampleNote')}
          </Typography>
        </>
      ) : (
        <PageSkeleton />
      )}
    </Box>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const config = useConfig()
  if (!config.data)
    return (
      <Box sx={{ p: 4 }}>
        <PageSkeleton />
      </Box>
    )
  const c = config.data
  const h = c.homepage
  return (
    <Box>
      {/* Hero */}
      <Band tone="secondary">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
            gap: { xs: 4, lg: 8 },
            alignItems: 'center',
            '& > *': { minWidth: 0 },
          }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              {h.eyebrow}
            </Typography>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2.25rem', md: '3.25rem', xl: '3.75rem' },
                maxWidth: 820,
                mb: 2.5,
                letterSpacing: '-0.02em',
              }}
            >
              {h.headline}
            </Typography>
            <Typography sx={{ maxWidth: 640, fontSize: { xs: 16, md: 18 }, color: 'text.secondary', mb: 3.5 }}>
              {h.subheadline}
            </Typography>
            <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap', mb: 5 }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<ArrowDownwardIcon />}
                href="#estimator"
              >
                {h.primaryCta}
              </Button>
              <Button variant="outlined" size="large" component={Link} to="/login">
                {h.professional.cta}
              </Button>
            </Stack>
            {h.stats.length > 0 && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(4, h.stats.length)}, auto)`,
                  gap: { xs: 3, md: 5 },
                  justifyContent: 'start',
                }}
              >
                {h.stats.map((s) => (
                  <Box key={s.label} sx={{ borderLeft: '1px solid', borderColor: 'text.disabled', pl: 2 }}>
                    <Typography
                      sx={{ fontFamily: FONT_MONO, fontSize: { xs: 24, md: 30 }, fontWeight: 500, lineHeight: 1 }}
                    >
                      {s.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          <ExampleSheet config={c} />
        </Box>
      </Band>

      {/* Estimator */}
      <Band>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 1, mb: 2.5 }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t('estimate.home.estimatorEyebrow')}
            </Typography>
            <Typography variant="h2">{t('estimate.home.estimatorTitle')}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('estimate.home.estimatorHint')}
          </Typography>
        </Stack>
        <HomeEstimator config={c} />
      </Band>

      {/* How it works */}
      {h.steps.length > 0 && (
        <Band>
          <Typography variant="overline" color="text.secondary">
            {t('estimate.home.howItWorks')}
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: `repeat(${Math.min(3, h.steps.length)}, 1fr)`,
                xl: `repeat(${Math.min(6, h.steps.length)}, 1fr)`,
              },
              gap: 0,
              borderTop: 1,
              borderColor: 'divider',
              '& > *': { minWidth: 0 },
            }}
          >
            {h.steps.map((s, i) => (
              <Box
                key={s.title}
                sx={{
                  pt: 2.5,
                  pb: 3,
                  pr: 3,
                  borderRight: { md: 1 },
                  borderBottom: { xs: 1, md: 0 },
                  borderColor: 'divider',
                  '&:last-of-type': { borderRight: 0, borderBottom: 0 },
                }}
              >
                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, color: 'secondary.main', mb: 1 }}>
                  {String(i + 1).padStart(2, '0')}
                </Typography>
                <Typography variant="h5" sx={{ mb: 0.75 }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Band>
      )}

      {/* Professional workspace */}
      <Band tone="secondary">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' },
            gap: { xs: 4, lg: 8 },
            alignItems: 'start',
            '& > *': { minWidth: 0 },
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: 'secondary.main', display: 'block', mb: 1 }}>
              {t('estimate.home.forProfessionals')}
            </Typography>
            <Typography
              variant="h2"
              sx={{ mb: 1.5, fontSize: { xs: '1.75rem', md: '2.25rem' }, letterSpacing: '-0.015em', maxWidth: 560 }}
            >
              {h.professional.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 520 }}>
              {h.professional.text}
            </Typography>
            <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" component={Link} to="/login">
                {h.professional.cta}
              </Button>
              <Button variant="outlined" size="large" href="#estimator">
                {t('estimate.home.tryAsClient')}
              </Button>
            </Stack>
          </Box>
          <Box
            component="ul"
            sx={{
              listStyle: 'none',
              m: 0,
              p: 0,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(3, 1fr)' },
              gap: '1px',
              bgcolor: 'divider',
              border: 1,
              borderColor: 'divider',
            }}
          >
            {h.professional.bullets.map((b, i) => (
              <Box
                component="li"
                key={b}
                sx={{
                  bgcolor: 'background.paper',
                  p: 2.5,
                  minHeight: 128,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 2,
                  borderTop: '2px solid transparent',
                  transition: 'border-color 120ms',
                  '&:hover': { borderTopColor: 'secondary.main' },
                }}
              >
                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, color: 'text.secondary' }}>
                  {String(i + 1).padStart(2, '0')}
                </Typography>
                <Typography sx={{ fontWeight: 500, lineHeight: 1.4 }}>{b}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Band>

      {/* Classes */}
      {h.showClassesTable && (
        <Band>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '4fr 8fr' },
              gap: { xs: 3, lg: 8 },
              '& > *': { minWidth: 0 },
            }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
                {t('estimate.home.classesEyebrow')}
              </Typography>
              <Typography variant="h2" sx={{ mt: 1, mb: 1.5 }}>
                {t('estimate.home.classesTitle')}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {t('estimate.home.classesText')}
              </Typography>
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                <Button component={Link} to="/budget" variant="outlined">
                  {t('nav.budget')}
                </Button>
                <Button component={Link} to="/reach" variant="outlined">
                  {t('nav.reach')}
                </Button>
                <Button component={Link} to="/cost-to-complete" variant="outlined">
                  {t('nav.complete')}
                </Button>
              </Stack>
            </Box>
            <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Table size="small" sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('estimate.home.table.level')}</TableCell>
                    <TableCell>{t('estimate.home.table.label')}</TableCell>
                    <TableCell align="right">{t('estimate.home.table.accuracy')}</TableCell>
                    <TableCell align="right">{t('estimate.home.table.contingency')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {c.classes.map((k) => (
                    <TableRow key={k.level}>
                      <TableCell sx={{ fontFamily: FONT_MONO }}>L{k.level}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{k.label}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: FONT_MONO }}>
                        ±{k.rangePct} %
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: FONT_MONO }}>
                        {k.contingencyPct} %
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Band>
      )}
    </Box>
  )
}
