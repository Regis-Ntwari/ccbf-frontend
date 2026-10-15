import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Alert from '@mui/material/Alert'
import HouseOutlinedIcon from '@mui/icons-material/HouseOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import type { Typology } from '@/shared/api/schemas'
import { TypologySchema } from '@/shared/api/schemas'
import { finalizeDraft, useWizardStore } from '@/shared/stores'
import { useQueryClient } from '@tanstack/react-query'
import { estimateApi } from '@/shared/api/endpoints'
import { qk } from '@/shared/api/keys'
import type { WizardStep } from '@/shared/stores'
import { useParseIntent } from './api'

const ICONS: Record<Typology, React.ReactNode> = {
  house: <HouseOutlinedIcon fontSize="large" />,
  apartments: <ApartmentOutlinedIcon fontSize="large" />,
  shop: <StorefrontOutlinedIcon fontSize="large" />,
  office: <BusinessOutlinedIcon fontSize="large" />,
  hotel: <HotelOutlinedIcon fontSize="large" />,
  school: <SchoolOutlinedIcon fontSize="large" />,
  other: <MoreHorizIcon fontSize="large" />,
}

const MISSING_TO_STEP: Record<string, WizardStep> = { typology: 'what', locationId: 'where', gfa: 'size', storeys: 'floors' }

/** J1 entry: free text (AI/parser) or tiles. Target: result in < 90 s. */
export function Landing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const parse = useParseIntent()
  const qc = useQueryClient()
  const freeText = useWizardStore((s) => s.freeText)
  const setFreeText = useWizardStore((s) => s.setFreeText)
  const setDraft = useWizardStore((s) => s.setDraft)
  const setPrefilled = useWizardStore((s) => s.setPrefilled)
  const reset = useWizardStore((s) => s.reset)
  const [text, setText] = useState(freeText)

  const submitText = async () => {
    if (!text.trim()) return
    reset()
    setFreeText(text)
    const res = await parse.mutateAsync(text)
    setDraft({ ...res.extracted, requestedClass: 1 })
    const filled = (Object.keys(res.extracted) as string[])
      .map((k) => MISSING_TO_STEP[k])
      .filter((s): s is WizardStep => Boolean(s))
    setPrefilled(filled)
    const first = res.missing[0]
    if (first) {
      void navigate({ to: '/estimate/new', search: { step: MISSING_TO_STEP[first]! } })
      return
    }
    // Nothing essential is missing: run a Level 1 estimate straight away (J1 target < 90 s).
    const { params } = finalizeDraft({ ...useWizardStore.getState().draft, requestedClass: 1 })
    if (!params) {
      void navigate({ to: '/estimate/new', search: { step: 'what' } })
      return
    }
    const result = await estimateApi.run(params)
    qc.setQueryData(qk.estimate(result.id), result)
    void navigate({ to: '/estimate/$estimateId', params: { estimateId: result.id } })
  }

  const pickTile = (typology: Typology) => {
    reset()
    setDraft({ typology })
    setPrefilled(['what'])
    void navigate({ to: '/estimate/new', search: { step: 'where' } })
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto', pt: { xs: 2, md: 6 }, pb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          {t('landing.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, fontSize: 18 }}>
          {t('landing.subtitle')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} component="form" onSubmit={(e) => { e.preventDefault(); void submitText() }}>
          <TextField
            fullWidth
            size="medium"
            placeholder={t('landing.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            slotProps={{ input: { startAdornment: <AutoAwesomeIcon color="action" sx={{ mr: 1 }} /> }, htmlInput: { 'aria-label': t('landing.title') } }}
          />
          <Button type="submit" variant="contained" size="large" disabled={parse.isPending || !text.trim()} sx={{ whiteSpace: 'nowrap', px: 4 }}>
            {t('landing.go')}
          </Button>
        </Stack>
        {parse.isError && <Alert severity="error" sx={{ mt: 2 }}>{t('common.error')}</Alert>}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          English, Kinyarwanda or French. The parser only fills in your answers; every cost comes from the engine.
        </Typography>
      </Box>

      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
        {t('landing.or')}
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 5 }}>
        {TypologySchema.options.map((ty) => (
          <Grid key={ty} size={{ xs: 6, sm: 4, md: 12 / 7 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea onClick={() => pickTile(ty)} sx={{ height: '100%', py: 2, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main' }}>{ICONS[ty]}</Box>
                <Typography variant="subtitle2">{t(`typology.${ty}`)}</Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {[
          { to: '/budget', icon: <SavingsOutlinedIcon color="secondary" />, title: t('landing.reverse'), text: t('landing.reverseText') },
          { to: '/reach', icon: <TimelineOutlinedIcon color="secondary" />, title: t('landing.reach'), text: t('landing.reachText') },
          { to: '/cost-to-complete', icon: <ConstructionOutlinedIcon color="secondary" />, title: t('landing.complete'), text: t('landing.completeText') },
        ].map((c) => (
          <Grid key={c.to} size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea component={Link} to={c.to} sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                    {c.icon}
                    <Typography variant="h5" component="h2">{c.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary">{c.text}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
