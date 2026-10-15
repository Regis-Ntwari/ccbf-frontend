import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import AddIcon from '@mui/icons-material/Add'
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { PageHeader } from '@/shared/components/PageHeader'
import { ErrorState, PageSkeleton } from '@/shared/components/States'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

import { ELEMENT_GROUPS, PHASE_CODES, QUALITY_LEVELS, RoleSchema, SaveConfigSchema } from '@/shared/api/schemas'
import { formatDate } from '@/shared/lib/format'
import { FONT_MONO } from '@/shared/theme/theme'
import { useAdminConfig, useResetConfig, useSaveConfig } from '@/features/config/api'
import { ConfigTable } from './ConfigTable'
import { LocalizedTextField } from './LocalizedTextField'
import { LOCALE_LABEL, SUPPORTED_LOCALES } from '@/shared/i18n'
import { missingLocales } from '@/shared/lib/localized'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { SETTINGS_TABS } from '@/routes/_authenticated/admin/settings'

function Section({ title, hint, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5">{title}</Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {hint}
        </Typography>
      )}
      {!hint && <Box sx={{ mb: 1.5 }} />}
      {children}
    </Box>
  )
}

/**
 * Platform configuration (Feature 14 / §14.11): every rule, label and piece of
 * homepage copy the product depends on, edited here and published as a version.
 */
export function PlatformSettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { tab } = useSearch({ from: '/_authenticated/admin/settings' })
  const config = useAdminConfig()
  const saveConfig = useSaveConfig()
  const resetConfig = useResetConfig()
  const [draft, setDraft] = useState(null)
  const [note, setNote] = useState('')
  const [publishOpen, setPublishOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [error, setError] = useState(null)
  /** Language whose text the localized fields edit; independent of the UI language. */
  const [lang, setLang] = useState('en')

  const baseline = useMemo(() => {
    if (!config.data) return null
    const rest = { ...config.data }
    delete rest.version
    delete rest.updatedAt
    delete rest.updatedBy
    delete rest.changelog
    return rest
  }, [config.data])
  const d = draft ?? baseline
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(baseline)
  const set = (key, value) => setDraft({ ...d, [key]: value })

  if (config.isPending || !d) return <PageSkeleton />
  if (config.isError) return <ErrorState error={config.error} onRetry={() => void config.refetch()} />
  const c = config.data

  const publish = () => {
    const parsed = SaveConfigSchema.safeParse({ config: d, note })
    if (!parsed.success)
      return setError(
        parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .slice(0, 5)
          .join(' · '),
      )
    setError(null)
    saveConfig.mutate(parsed.data, {
      onSuccess: () => {
        setDraft(null)
        setNote('')
        setPublishOpen(false)
      },
      onError: (e) => setError(e.message),
    })
  }
  const shareSum = d.packages.reduce((a, p) => a + p.share, 0)
  const locales = SUPPORTED_LOCALES.filter((l) => d.localization.enabledLocales.includes(l))
  const missingByLang = Object.fromEntries(locales.map((l) => [l, 0]))
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk)
    if (v && typeof v === 'object') {
      if (typeof v.en === 'string') {
        for (const l of missingLocales(v, locales)) missingByLang[l] += 1
        return
      }
      Object.values(v).forEach(walk)
    }
  }
  walk(d)
  const tableLang = { lang, locales }
  const elementOptions = ELEMENT_GROUPS.map((g) => ({
    value: g,
    label: d.elementLabels[g]?.[lang] || d.elementLabels[g]?.en || g,
  }))
  const phaseOptions = [
    ...PHASE_CODES.map((p) => ({ value: p, label: `${p} ${d.phaseNames[p]?.[lang] || d.phaseNames[p]?.en || ''}` })),
    { value: 'spread', label: t('admin.settings.spread') },
  ]

  return (
    <Box>
      <PageHeader
        eyebrow={t('admin.settings.eyebrow', {
          version: c.version,
          date: formatDate(c.updatedAt, i18n.language),
          by: c.updatedBy,
        })}
        title={t('admin.settings.title')}
        subtitle={t('admin.settings.subtitle')}
        chips={
          dirty ? (
            <Chip size="small" color="warning" label={t('admin.settings.unpublished')} />
          ) : (
            <Chip size="small" variant="outlined" label={t('admin.settings.upToDate')} />
          )
        }
        actions={
          <>
            <Button variant="outlined" startIcon={<RestartAltIcon />} disabled={!dirty} onClick={() => setDraft(null)}>
              {t('admin.settings.discard')}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PublishOutlinedIcon />}
              disabled={!dirty || saveConfig.isPending}
              onClick={() => setPublishOpen(true)}
            >
              {t('admin.settings.publishVersion')}
            </Button>
          </>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Tabs
        value={tab}
        onChange={(_, v) => void navigate({ to: '/admin/settings', search: { tab: v }, replace: true })}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {SETTINGS_TABS.map((id) => (
          <Tab key={id} value={id} label={t(`admin.settings.tabs.${id}`)} />
        ))}
      </Tabs>

      <Stack direction="row" sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          {t('admin.settings.contentLanguage')}
        </Typography>
        <ToggleButtonGroup size="small" exclusive value={lang} onChange={(_, v) => v && setLang(v)}>
          {locales.map((l) => (
            <ToggleButton key={l} value={l} sx={{ gap: 1, px: 1.5 }}>
              {LOCALE_LABEL[l]}
              {missingByLang[l] > 0 && (
                <Chip size="small" color="warning" label={missingByLang[l]} sx={{ height: 18, fontSize: 10 }} />
              )}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          {t('admin.settings.contentLanguageHint')}
        </Typography>
      </Stack>

      {tab === 'branding' && (
        <Section title={t('admin.settings.branding.title')} hint={t('admin.settings.branding.hint')}>
          <Grid container spacing={2} sx={{ maxWidth: 900 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('admin.settings.branding.appName')}
                value={d.branding.appName}
                onChange={(e) => set('branding', { ...d.branding, appName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                label={t('admin.settings.branding.shortName')}
                value={d.branding.shortName}
                onChange={(e) => set('branding', { ...d.branding, shortName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                label={t('admin.settings.branding.region')}
                value={d.branding.region}
                onChange={(e) => set('branding', { ...d.branding, region: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <LocalizedTextField
                fullWidth
                label={t('admin.settings.branding.tagline')}
                value={d.branding.tagline}
                lang={lang}
                locales={locales}
                onChange={(v) => set('branding', { ...d.branding, tagline: v })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                label={t('admin.settings.branding.currency')}
                value={d.branding.currency}
                onChange={(e) => set('branding', { ...d.branding, currency: e.target.value })}
              >
                <MenuItem value="RWF">RWF</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                fullWidth
                label={t('admin.settings.branding.supportEmail')}
                value={d.branding.supportEmail}
                onChange={(e) => set('branding', { ...d.branding, supportEmail: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <LocalizedTextField
                fullWidth
                multiline
                minRows={2}
                label={t('admin.settings.branding.footerDisclaimer')}
                value={d.branding.footerDisclaimer}
                lang={lang}
                locales={locales}
                onChange={(v) => set('branding', { ...d.branding, footerDisclaimer: v })}
              />
            </Grid>
          </Grid>
        </Section>
      )}

      {tab === 'homepage' && (
        <>
          <Section title={t('admin.settings.homepage.hero')} hint={t('admin.settings.homepage.heroHint')}>
            <Grid container spacing={2} sx={{ maxWidth: 900 }}>
              <Grid size={{ xs: 12 }}>
                <LocalizedTextField
                  fullWidth
                  label={t('admin.settings.homepage.eyebrow')}
                  value={d.homepage.eyebrow}
                  lang={lang}
                  locales={locales}
                  onChange={(v) => set('homepage', { ...d.homepage, eyebrow: v })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <LocalizedTextField
                  fullWidth
                  multiline
                  label={t('admin.settings.homepage.headline')}
                  value={d.homepage.headline}
                  lang={lang}
                  locales={locales}
                  onChange={(v) => set('homepage', { ...d.homepage, headline: v })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <LocalizedTextField
                  fullWidth
                  multiline
                  minRows={2}
                  label={t('admin.settings.homepage.subheadline')}
                  value={d.homepage.subheadline}
                  lang={lang}
                  locales={locales}
                  onChange={(v) => set('homepage', { ...d.homepage, subheadline: v })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <LocalizedTextField
                  fullWidth
                  label={t('admin.settings.homepage.primaryCta')}
                  value={d.homepage.primaryCta}
                  lang={lang}
                  locales={locales}
                  onChange={(v) => set('homepage', { ...d.homepage, primaryCta: v })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={d.homepage.showClassesTable}
                      onChange={(e) => set('homepage', { ...d.homepage, showClassesTable: e.target.checked })}
                    />
                  }
                  label={t('admin.settings.homepage.showClassesTable')}
                />
              </Grid>
            </Grid>
          </Section>
          <Section title={t('admin.settings.homepage.stats')} hint={t('admin.settings.homepage.statsHint')}>
            <ConfigTable
              rows={d.homepage.stats}
              columns={[
                { key: 'value', label: t('admin.settings.homepage.value'), kind: 'text', width: 120 },
                { key: 'label', label: t('admin.settings.common.label'), kind: 'localized' },
              ]}
              {...tableLang}
              rowKey={(_, i) => String(i)}
              onChange={(rows) => set('homepage', { ...d.homepage, stats: rows })}
              onRemove={(i) =>
                set('homepage', { ...d.homepage, stats: d.homepage.stats.filter((_, idx) => idx !== i) })
              }
            />
            <Button
              size="small"
              startIcon={<AddIcon />}
              sx={{ mt: 1 }}
              disabled={d.homepage.stats.length >= 4}
              onClick={() => set('homepage', { ...d.homepage, stats: [...d.homepage.stats, { value: '', label: '' }] })}
            >
              {t('admin.settings.homepage.addFigure')}
            </Button>
          </Section>
          <Section title={t('admin.settings.homepage.steps')} hint={t('admin.settings.homepage.stepsHint')}>
            <ConfigTable
              rows={d.homepage.steps}
              columns={[
                { key: 'title', label: t('admin.settings.common.title'), kind: 'localized', width: 260 },
                { key: 'text', label: t('admin.settings.common.text'), kind: 'localized' },
              ]}
              {...tableLang}
              rowKey={(_, i) => String(i)}
              onChange={(rows) => set('homepage', { ...d.homepage, steps: rows })}
              onRemove={(i) =>
                set('homepage', { ...d.homepage, steps: d.homepage.steps.filter((_, idx) => idx !== i) })
              }
            />
            <Button
              size="small"
              startIcon={<AddIcon />}
              sx={{ mt: 1 }}
              disabled={d.homepage.steps.length >= 6}
              onClick={() => set('homepage', { ...d.homepage, steps: [...d.homepage.steps, { title: '', text: '' }] })}
            >
              {t('admin.settings.homepage.addStep')}
            </Button>
          </Section>
          <Section
            title={t('admin.settings.homepage.professional')}
            hint={t('admin.settings.homepage.professionalHint')}
          >
            <Grid container spacing={2} sx={{ maxWidth: 900 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <LocalizedTextField
                  fullWidth
                  label={t('admin.settings.common.title')}
                  value={d.homepage.professional.title}
                  lang={lang}
                  locales={locales}
                  onChange={(v) =>
                    set('homepage', { ...d.homepage, professional: { ...d.homepage.professional, title: v } })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <LocalizedTextField
                  fullWidth
                  label={t('admin.settings.homepage.cta')}
                  value={d.homepage.professional.cta}
                  lang={lang}
                  locales={locales}
                  onChange={(v) =>
                    set('homepage', { ...d.homepage, professional: { ...d.homepage.professional, cta: v } })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <LocalizedTextField
                  fullWidth
                  multiline
                  label={t('admin.settings.common.text')}
                  value={d.homepage.professional.text}
                  lang={lang}
                  locales={locales}
                  onChange={(v) =>
                    set('homepage', { ...d.homepage, professional: { ...d.homepage.professional, text: v } })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label={t('admin.settings.homepage.bullets', { lang: LOCALE_LABEL[lang] })}
                  placeholder={lang !== 'en' ? d.homepage.professional.bullets.map((b) => b.en).join('\n') : undefined}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={d.homepage.professional.bullets.map((b) => b[lang] ?? '').join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').slice(0, 6)
                    const prev = d.homepage.professional.bullets
                    const bullets = lines.map((line, i) => {
                      const base = prev[i] ?? { en: '' }
                      const next = { ...base, [lang]: line }
                      if (lang !== 'en' && !line) delete next[lang]
                      return next
                    })
                    set('homepage', {
                      ...d.homepage,
                      professional: { ...d.homepage.professional, bullets: bullets.filter((b) => b.en || b[lang]) },
                    })
                  }}
                />
              </Grid>
            </Grid>
          </Section>
          <Section title={t('admin.settings.homepage.example')} hint={t('admin.settings.homepage.exampleHint')}>
            <Grid container spacing={2} sx={{ maxWidth: 900 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label={t('admin.settings.homepage.type')}
                  value={d.homepage.example.typology}
                  onChange={(e) =>
                    set('homepage', { ...d.homepage, example: { ...d.homepage.example, typology: e.target.value } })
                  }
                >
                  {d.typologies.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.label[lang] || t.label.en}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label={t('admin.settings.common.location')}
                  value={d.homepage.example.locationId}
                  onChange={(e) =>
                    set('homepage', { ...d.homepage, example: { ...d.homepage.example, locationId: e.target.value } })
                  }
                >
                  {d.locations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 4, md: 2 }}>
                <TextField
                  type="number"
                  fullWidth
                  label={t('admin.settings.homepage.area')}
                  value={d.homepage.example.gfa}
                  onChange={(e) =>
                    set('homepage', { ...d.homepage, example: { ...d.homepage.example, gfa: Number(e.target.value) } })
                  }
                />
              </Grid>
              <Grid size={{ xs: 4, md: 2 }}>
                <TextField
                  type="number"
                  fullWidth
                  label={t('admin.settings.homepage.floors')}
                  value={d.homepage.example.storeys}
                  onChange={(e) =>
                    set('homepage', {
                      ...d.homepage,
                      example: { ...d.homepage.example, storeys: Number(e.target.value) },
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 4, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  label={t('admin.settings.homepage.finish')}
                  value={d.homepage.example.quality}
                  onChange={(e) =>
                    set('homepage', { ...d.homepage, example: { ...d.homepage.example, quality: e.target.value } })
                  }
                >
                  {QUALITY_LEVELS.map((q) => (
                    <MenuItem key={q} value={q}>
                      {q}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Section>
        </>
      )}

      {tab === 'typologies' && (
        <Section title={t('admin.settings.typologies.title')} hint={t('admin.settings.typologies.hint')}>
          <ConfigTable
            rows={d.typologies}
            columns={[
              { key: 'id', label: t('admin.settings.common.id'), kind: 'readonly', width: 100 },
              { key: 'label', label: t('admin.settings.common.label'), kind: 'localized' },
              {
                key: 'baseRatePerM2',
                label: t('admin.settings.typologies.baseRate'),
                kind: 'money',
                step: 5000,
                width: 180,
              },
              { key: 'enabled', label: t('admin.settings.common.enabled'), kind: 'boolean', width: 90 },
            ]}
            {...tableLang}
            rowKey={(r) => r.id}
            onChange={(rows) => set('typologies', rows)}
          />
        </Section>
      )}

      {tab === 'finishes' && (
        <>
          <Section title={t('admin.settings.finishes.title')} hint={t('admin.settings.finishes.hint')}>
            <ConfigTable
              rows={d.qualities}
              columns={[
                { key: 'id', label: t('admin.settings.common.id'), kind: 'readonly', width: 70 },
                { key: 'label', label: t('admin.settings.common.label'), kind: 'localized', width: 200 },
                { key: 'description', label: t('admin.settings.finishes.description'), kind: 'localized' },
                {
                  key: 'multiplier',
                  label: t('admin.settings.finishes.multiplier'),
                  kind: 'number',
                  step: 0.05,
                  width: 120,
                },
              ]}
              {...tableLang}
              rowKey={(r) => r.id}
              onChange={(rows) => set('qualities', rows)}
            />
          </Section>
          <Section title={t('admin.settings.finishes.curves')} hint={t('admin.settings.finishes.curvesHint')}>
            <ConfigTable
              rows={ELEMENT_GROUPS.map((g) => ({
                group: g,
                label: d.elementLabels[g],
                ECO: d.elementMultipliers[g]?.ECO ?? null,
                STD: d.elementMultipliers[g]?.STD ?? null,
                PRM: d.elementMultipliers[g]?.PRM ?? null,
                LUX: d.elementMultipliers[g]?.LUX ?? null,
              }))}
              columns={[
                { key: 'group', label: t('admin.settings.finishes.element'), kind: 'readonly', width: 110 },
                { key: 'label', label: t('admin.settings.common.label'), kind: 'localized', width: 220 },
                { key: 'ECO', label: 'ECO', kind: 'number', step: 0.1, nullable: true, width: 100 },
                { key: 'STD', label: 'STD', kind: 'number', step: 0.1, nullable: true, width: 100 },
                { key: 'PRM', label: 'PRM', kind: 'number', step: 0.1, nullable: true, width: 100 },
                { key: 'LUX', label: 'LUX', kind: 'number', step: 0.1, nullable: true, width: 100 },
              ]}
              {...tableLang}
              rowKey={(r) => r.group}
              onChange={(rows) => {
                const labels = { ...d.elementLabels }
                const mult = {}
                for (const r of rows) {
                  labels[r.group] = r.label
                  if (r.ECO != null && r.STD != null && r.PRM != null && r.LUX != null)
                    mult[r.group] = { ECO: r.ECO, STD: r.STD, PRM: r.PRM, LUX: r.LUX }
                }
                setDraft({ ...d, elementLabels: labels, elementMultipliers: mult })
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {t('admin.settings.finishes.blankHint')}
            </Typography>
          </Section>
        </>
      )}

      {tab === 'packages' && (
        <>
          <Section
            title={t('admin.settings.packages.title')}
            hint={t('admin.settings.packages.hint', { pct: (shareSum * 100).toFixed(1) })}
          >
            {Math.abs(shareSum - 1) > 0.02 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                {t('admin.settings.packages.sumWarning', { pct: (shareSum * 100).toFixed(1) })}
              </Alert>
            )}
            <ConfigTable
              rows={d.packages}
              columns={[
                { key: 'code', label: t('admin.settings.common.code'), kind: 'readonly', width: 70 },
                { key: 'name', label: t('admin.settings.packages.package'), kind: 'localized' },
                {
                  key: 'phase',
                  label: t('admin.settings.packages.phase'),
                  kind: 'select',
                  options: phaseOptions,
                  width: 220,
                },
                {
                  key: 'element',
                  label: t('admin.settings.packages.elementGroup'),
                  kind: 'select',
                  options: elementOptions,
                  nullable: true,
                  width: 160,
                },
                {
                  key: 'share',
                  label: t('admin.settings.packages.share'),
                  kind: 'percent',
                  fraction: true,
                  step: 0.5,
                  width: 110,
                },
              ]}
              {...tableLang}
              rowKey={(r) => r.code}
              onChange={(rows) => set('packages', rows)}
            />
          </Section>
          <Section title={t('admin.settings.packages.phaseNames')} hint={t('admin.settings.packages.phaseNamesHint')}>
            <ConfigTable
              rows={PHASE_CODES.map((p) => ({ code: p, name: d.phaseNames[p] }))}
              columns={[
                { key: 'code', label: t('admin.settings.common.code'), kind: 'readonly', width: 70 },
                { key: 'name', label: t('admin.settings.common.name'), kind: 'localized' },
              ]}
              {...tableLang}
              rowKey={(r) => r.code}
              onChange={(rows) => set('phaseNames', Object.fromEntries(rows.map((r) => [r.code, r.name])))}
            />
          </Section>
        </>
      )}

      {tab === 'extras' && (
        <Section title={t('admin.settings.extras.title')} hint={t('admin.settings.extras.hint')}>
          <ConfigTable
            rows={d.features}
            columns={[
              { key: 'id', label: t('admin.settings.common.id'), kind: 'readonly', width: 110 },
              { key: 'label', label: t('admin.settings.common.label'), kind: 'localized', width: 240 },
              { key: 'enabled', label: t('admin.settings.extras.on'), kind: 'boolean', width: 60 },
              {
                key: 'fixed',
                label: t('admin.settings.extras.fixed'),
                kind: 'money',
                nullable: true,
                step: 100000,
                width: 150,
              },
              {
                key: 'perBedroom',
                label: t('admin.settings.extras.perBedroom'),
                kind: 'money',
                nullable: true,
                step: 100000,
                width: 150,
              },
              {
                key: 'pctOfBase',
                label: t('admin.settings.extras.pctOfBase'),
                kind: 'percent',
                fraction: true,
                nullable: true,
                width: 110,
              },
              {
                key: 'boostGroup',
                label: t('admin.settings.extras.boostElement'),
                kind: 'select',
                options: elementOptions,
                nullable: true,
                width: 150,
              },
              {
                key: 'boostPct',
                label: t('admin.settings.extras.boostPct'),
                kind: 'percent',
                nullable: true,
                step: 5,
                width: 110,
              },
            ]}
            {...tableLang}
            rowKey={(r) => r.id}
            onChange={(rows) => set('features', rows)}
          />
        </Section>
      )}

      {tab === 'locations' && (
        <Section title={t('admin.settings.locations.title')} hint={t('admin.settings.locations.hint')}>
          <ConfigTable
            rows={d.locations}
            columns={[
              { key: 'id', label: t('admin.settings.common.id'), kind: 'text', width: 120 },
              { key: 'name', label: t('admin.settings.common.name'), kind: 'text' },
              { key: 'province', label: t('admin.settings.locations.province'), kind: 'text' },
              { key: 'factor', label: t('admin.settings.locations.factor'), kind: 'number', step: 0.01, width: 110 },
              { key: 'enabled', label: t('admin.settings.common.enabled'), kind: 'boolean', width: 90 },
            ]}
            rowKey={(_, i) => String(i)}
            onChange={(rows) => set('locations', rows)}
            onRemove={(i) =>
              set(
                'locations',
                d.locations.filter((_, idx) => idx !== i),
              )
            }
          />
          <Button
            size="small"
            startIcon={<AddIcon />}
            sx={{ mt: 1 }}
            onClick={() =>
              set('locations', [
                ...d.locations,
                {
                  id: `district_${d.locations.length + 1}`,
                  name: t('admin.settings.locations.newDistrict'),
                  province: '',
                  factor: 1.05,
                  enabled: true,
                },
              ])
            }
          >
            {t('admin.settings.locations.add')}
          </Button>
        </Section>
      )}

      {tab === 'classes' && (
        <>
          <Section title={t('admin.settings.classes.title')} hint={t('admin.settings.classes.hint')}>
            <ConfigTable
              rows={d.classes}
              columns={[
                { key: 'level', label: t('admin.settings.classes.level'), kind: 'readonly', width: 70 },
                { key: 'label', label: t('admin.settings.common.label'), kind: 'localized' },
                { key: 'rangePct', label: t('admin.settings.classes.range'), kind: 'percent', width: 110 },
                { key: 'contingencyPct', label: t('admin.settings.classes.contingency'), kind: 'percent', width: 120 },
              ]}
              {...tableLang}
              rowKey={(r) => String(r.level)}
              onChange={(rows) => set('classes', rows)}
            />
          </Section>
          <Section title={t('admin.settings.classes.financial')}>
            <Grid container spacing={2} sx={{ maxWidth: 900 }}>
              {['feesPct', 'vatPct', 'defaultOverheadPct', 'defaultContingencyPct', 'storeyFactorPct'].map((k) => (
                <Grid key={k} size={{ xs: 6, md: 4 }}>
                  <TextField
                    type="number"
                    fullWidth
                    label={t(`admin.settings.classes.${k}`)}
                    value={d.financial[k]}
                    onChange={(e) => set('financial', { ...d.financial, [k]: Number(e.target.value) })}
                    slotProps={{ htmlInput: { step: 0.5, min: 0, style: { fontFamily: FONT_MONO } } }}
                  />
                </Grid>
              ))}
              <Grid size={{ xs: 6, md: 4 }}>
                <TextField
                  type="number"
                  fullWidth
                  label={t('admin.settings.classes.slopeGentle')}
                  value={d.financial.slopeFactors.gentle}
                  onChange={(e) =>
                    set('financial', {
                      ...d.financial,
                      slopeFactors: { ...d.financial.slopeFactors, gentle: Number(e.target.value) },
                    })
                  }
                  slotProps={{ htmlInput: { step: 0.01, min: 1 } }}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <TextField
                  type="number"
                  fullWidth
                  label={t('admin.settings.classes.slopeSteep')}
                  value={d.financial.slopeFactors.steep}
                  onChange={(e) =>
                    set('financial', {
                      ...d.financial,
                      slopeFactors: { ...d.financial.slopeFactors, steep: Number(e.target.value) },
                    })
                  }
                  slotProps={{ htmlInput: { step: 0.01, min: 1 } }}
                />
              </Grid>
            </Grid>
          </Section>
        </>
      )}

      {tab === 'workflow' && (
        <Section title={t('admin.settings.workflow.title')}>
          <Grid container spacing={2} sx={{ maxWidth: 900 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                type="number"
                fullWidth
                label={t('admin.settings.workflow.staleDays')}
                value={d.workflow.stalePriceDays}
                onChange={(e) => set('workflow', { ...d.workflow, stalePriceDays: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                type="number"
                fullWidth
                label={t('admin.settings.workflow.anomalyThreshold')}
                value={d.workflow.anomalyThresholdPct}
                onChange={(e) => set('workflow', { ...d.workflow, anomalyThresholdPct: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                type="number"
                fullWidth
                label={t('admin.settings.workflow.maxQuestions')}
                value={d.workflow.maxEssentialQuestions}
                onChange={(e) => set('workflow', { ...d.workflow, maxEssentialQuestions: Number(e.target.value) })}
                slotProps={{ htmlInput: { min: 1, max: 10 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={d.workflow.blockExportOnStalePrices}
                    onChange={(e) => set('workflow', { ...d.workflow, blockExportOnStalePrices: e.target.checked })}
                  />
                }
                label={t('admin.settings.workflow.blockExport')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={d.workflow.requireOverrideReason}
                    onChange={(e) => set('workflow', { ...d.workflow, requireOverrideReason: e.target.checked })}
                  />
                }
                label={t('admin.settings.workflow.requireReason')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label={t('admin.settings.workflow.approveRoles')}
                value={d.workflow.approveBoqRoles}
                onChange={(e) =>
                  set('workflow', {
                    ...d.workflow,
                    approveBoqRoles: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                  })
                }
                slotProps={{
                  select: { multiple: true, renderValue: (v) => v.map((r) => t(`shell.roles.${r}`)).join(', ') },
                }}
              >
                {RoleSchema.options.map((r) => (
                  <MenuItem key={r} value={r}>
                    {t(`shell.roles.${r}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Section>
      )}

      {tab === 'localization' && (
        <Section title={t('admin.settings.localization.title')}>
          <Grid container spacing={2} sx={{ maxWidth: 600 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label={t('admin.settings.localization.defaultLanguage')}
                value={d.localization.defaultLocale}
                onChange={(e) => set('localization', { ...d.localization, defaultLocale: e.target.value })}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="rw">Kinyarwanda</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2}>
                {['en', 'rw', 'fr'].map((l) => (
                  <FormControlLabel
                    key={l}
                    control={
                      <Switch
                        checked={d.localization.enabledLocales.includes(l)}
                        disabled={l === d.localization.defaultLocale}
                        onChange={(e) =>
                          set('localization', {
                            ...d.localization,
                            enabledLocales: e.target.checked
                              ? [...d.localization.enabledLocales, l]
                              : d.localization.enabledLocales.filter((x) => x !== l),
                          })
                        }
                      />
                    }
                    label={l === 'en' ? 'English' : l === 'rw' ? 'Kinyarwanda' : 'Français'}
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Section>
      )}

      {tab === 'history' && (
        <Section title={t('admin.settings.history.title')} hint={t('admin.settings.history.hint')}>
          <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            {c.changelog.map((e) => (
              <Box
                key={e.version}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '80px 160px 1fr',
                  gap: 2,
                  px: 2,
                  py: 1.25,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:last-of-type': { borderBottom: 0 },
                }}
              >
                <Typography sx={{ fontFamily: FONT_MONO }}>v{e.version}</Typography>
                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, color: 'text.secondary' }}>
                  {formatDate(e.at, i18n.language)}
                </Typography>
                <Typography variant="body2">
                  {e.note}{' '}
                  <Typography component="span" variant="caption" color="text.secondary">
                    · {e.by}
                  </Typography>
                </Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 3 }} />
          <Button variant="outlined" color="error" onClick={() => setResetOpen(true)} disabled={resetConfig.isPending}>
            {t('admin.settings.history.reset')}
          </Button>
        </Section>
      )}

      <Dialog open={publishOpen} onClose={() => setPublishOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('admin.settings.publishDialog.title', { version: c.version + 1 })}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('admin.settings.publishDialog.text')}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label={t('admin.settings.publishDialog.note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={publish}
            disabled={saveConfig.isPending || note.trim().length < 3}
          >
            {t('admin.settings.publishDialog.publish')}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={resetOpen}
        title={t('admin.settings.resetDialog.title')}
        text={t('admin.settings.resetDialog.text')}
        confirmLabel={t('admin.settings.resetDialog.confirm')}
        destructive
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false)
          setDraft(null)
          resetConfig.mutate()
        }}
      />
    </Box>
  )
}
