import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Divider from '@mui/material/Divider'
import { Fragment } from 'react'
import PrintIcon from '@mui/icons-material/Print'

import { estimateQuery } from '@/features/estimate/api'
import { boqQuery } from '@/features/boq/api'
import { ErrorState, PageSkeleton } from '@/shared/components/States'
import { Money } from '@/shared/components/Money'
import { formatDate, formatMoney, formatNumber, unitLabel } from '@/shared/lib/format'
import { FONT_MONO } from '@/shared/theme/theme'

function Row({ k, v }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.secondary', pl: 0, width: '40%', borderBottomStyle: 'dashed' }}>{k}</TableCell>
      <TableCell sx={{ fontFamily: FONT_MONO, pr: 0, borderBottomStyle: 'dashed' }}>{v}</TableCell>
    </TableRow>
  )
}

/**
 * Printable report (Section 13). Client report: summary, ranges, phases, options,
 * assumptions, disclaimer, no rates. QS report: adds basis of estimate and the full BOQ.
 */
export function ReportDocument({ project, type }) {
  const { t, i18n } = useTranslation()
  const estimate = useQuery({
    ...estimateQuery(project.latestEstimateId ?? ''),
    enabled: Boolean(project.latestEstimateId),
  })
  const boq = useQuery({ ...boqQuery(project.id), enabled: type === 'qs' })
  if (estimate.isPending) return <PageSkeleton />
  if (estimate.isError) return <ErrorState error={estimate.error} onRetry={() => void estimate.refetch()} />
  const e = estimate.data
  const ref = project.id.replace('prj_', 'PRJ-').toUpperCase()
  return (
    <Box>
      <Stack direction="row" className="no-print" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          {type === 'client' ? t('workspace.reports.clientReport') : t('workspace.reports.qsReport')} ·{' '}
          {t('workspace.reports.preview')}
        </Typography>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
          {t('workspace.reports.print')}
        </Button>
      </Stack>
      <Box
        sx={{
          maxWidth: 820,
          mx: 'auto',
          bgcolor: '#fff',
          color: '#252724',
          border: 1,
          borderColor: 'divider',
          p: { xs: 3, md: 6 },
          '@media print': { border: 0, p: 0, maxWidth: 'none' },
        }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.08em', color: '#5f605c' }}>
              {type === 'client' ? t('workspace.reports.headClient') : t('workspace.reports.headQs')}
            </Typography>
            <Typography variant="h1" sx={{ fontSize: 28, mt: 0.5 }}>
              {project.name}
            </Typography>
            <Typography sx={{ color: '#5f605c' }}>
              {t(`typology.${project.typology}`)} · {project.locationName}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', fontFamily: FONT_MONO, fontSize: 12, color: '#5f605c' }}>
            <div>{ref}</div>
            <div>{formatDate(new Date().toISOString(), i18n.language)}</div>
            <div>{e.classLabel}</div>
          </Box>
        </Stack>
        <Divider sx={{ borderColor: '#252724', mb: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 4, mb: 4 }}>
          <Box>
            <Typography variant="overline" sx={{ color: '#5f605c' }}>
              {t('result.range')}
            </Typography>
            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 24, fontWeight: 500, lineHeight: 1.2 }}>
              {formatMoney(e.total.low, 'RWF', i18n.language, { compact: true })} –{' '}
              {formatMoney(e.total.high, 'RWF', i18n.language, { compact: true })}
            </Typography>
            <Typography sx={{ color: '#5f605c' }}>
              {t('workspace.reports.mostLikelyLine', {
                mid: formatMoney(e.total.mid, 'RWF', i18n.language),
                perM2: formatMoney(e.costPerM2, 'RWF', i18n.language),
              })}
            </Typography>
          </Box>
          <Table size="small">
            <TableBody>
              <Row k={t('workspace.reports.floorArea')} v={`${e.params.gfa} m²`} />
              <Row k={t('workspace.reports.floors')} v={e.params.storeys} />
              <Row k={t('workspace.reports.finish')} v={t(`quality.${e.params.quality}`)} />
              <Row
                k={t('workspace.reports.programme')}
                v={t('workspace.reports.programmeMonths', { n: e.durationMonths })}
              />
              <Row k={t('common.class')} v={t('workspace.level', { n: e.estimateClass })} />
            </TableBody>
          </Table>
        </Box>

        <Typography variant="h4" sx={{ mb: 1 }}>
          {t('result.phases')}
        </Typography>
        <Table size="small" sx={{ mb: 4 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('workspace.columns.phase')}</TableCell>
              <TableCell align="right">{t('workspace.columns.share')}</TableCell>
              <TableCell align="right">{t('workspace.columns.amount')}</TableCell>
              <TableCell align="right">{t('workspace.columns.cumulative')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {e.phases
              .filter((p) => p.amount > 0)
              .map((p) => (
                <TableRow key={p.code}>
                  <TableCell>
                    <span style={{ fontFamily: FONT_MONO, marginRight: 8 }}>{p.code}</span>
                    {p.name}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT_MONO }}>
                    {p.pct} %
                  </TableCell>
                  <TableCell align="right">
                    <Money value={p.amount} />
                  </TableCell>
                  <TableCell align="right">
                    <Money value={p.cumulative} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <Typography variant="h4" sx={{ mb: 1 }}>
          {t('workspace.reports.finishOptions')}
        </Typography>
        <Table size="small" sx={{ mb: 4 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('workspace.columns.finish')}</TableCell>
              <TableCell align="right">{t('workspace.columns.low')}</TableCell>
              <TableCell align="right">{t('workspace.columns.high')}</TableCell>
              <TableCell align="right">{t('workspace.columns.perM2')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {e.qualityOptions.map((o) => (
              <TableRow key={o.quality}>
                <TableCell>{t(`quality.${o.quality}`)}</TableCell>
                <TableCell align="right">
                  <Money value={o.total.low} />
                </TableCell>
                <TableCell align="right">
                  <Money value={o.total.high} />
                </TableCell>
                <TableCell align="right">
                  <Money value={o.costPerM2} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {type === 'qs' && (
          <>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {t('workspace.reports.basis')}
            </Typography>
            <Table size="small" sx={{ mb: 4 }}>
              <TableBody>
                <Row k={t('workspace.reports.engineVersion')} v={e.engineVersion} />
                <Row k={t('workspace.reports.rulesVersion')} v={e.rulesVersion} />
                <Row k={t('workspace.reports.priceSnapshot')} v={e.priceSnapshotId} />
                <Row
                  k={t('workspace.reports.constructionCost')}
                  v={formatMoney(e.constructionCost.mid, 'RWF', i18n.language)}
                />
                <Row k={t('workspace.reports.contingency')} v={formatMoney(e.contingency, 'RWF', i18n.language)} />
                <Row k={t('workspace.reports.feesTaxes')} v={formatMoney(e.feesAndTaxes, 'RWF', i18n.language)} />
              </TableBody>
            </Table>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {t('workspace.reports.boqTitle')}
            </Typography>
            {boq.isPending && <PageSkeleton />}
            {boq.isError && <ErrorState error={boq.error} />}
            {boq.data && (
              <Table size="small" sx={{ mb: 4 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('workspace.columns.item')}</TableCell>
                    <TableCell>{t('workspace.columns.description')}</TableCell>
                    <TableCell>{t('workspace.columns.unit')}</TableCell>
                    <TableCell align="right">{t('workspace.columns.qty')}</TableCell>
                    <TableCell align="right">{t('workspace.columns.rate')}</TableCell>
                    <TableCell align="right">{t('workspace.columns.amount')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boq.data.bills.map((bill) => (
                    <Fragment key={bill.code}>
                      <TableRow>
                        <TableCell colSpan={6} sx={{ fontWeight: 600, bgcolor: '#F1EEE6' }}>
                          {t('workspace.reports.bill', { code: bill.code, name: bill.name })}
                        </TableCell>
                      </TableRow>
                      {bill.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell sx={{ fontFamily: FONT_MONO }}>{it.code}</TableCell>
                          <TableCell>{it.description}</TableCell>
                          <TableCell sx={{ fontFamily: FONT_MONO }}>{unitLabel(t, it.unit)}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: FONT_MONO }}>
                            {formatNumber(it.qty, i18n.language, 2)}
                          </TableCell>
                          <TableCell align="right">
                            <Money value={it.rate} />
                          </TableCell>
                          <TableCell align="right">
                            <Money value={it.amount} />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={5} align="right" sx={{ color: '#5f605c' }}>
                          {t('workspace.reports.subtotalBill', { code: bill.code })}
                        </TableCell>
                        <TableCell align="right">
                          <Money value={bill.subtotal} />
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      {t('workspace.reports.measuredWork')}
                    </TableCell>
                    <TableCell align="right">
                      <Money value={boq.data.measuredSubtotal} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      {t('workspace.reports.overheadsPct', { pct: boq.data.overheadPct })}
                    </TableCell>
                    <TableCell align="right">
                      <Money value={boq.data.overhead} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      {t('workspace.reports.contingencyPct', { pct: boq.data.contingencyPct })}
                    </TableCell>
                    <TableCell align="right">
                      <Money value={boq.data.contingency} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      {t('workspace.reports.vatPct', { pct: boq.data.vatPct })}
                    </TableCell>
                    <TableCell align="right">
                      <Money value={boq.data.vat} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 600 }}>
                      {t('workspace.columns.grandTotal')}
                    </TableCell>
                    <TableCell align="right">
                      <Money value={boq.data.grandTotal} sx={{ fontWeight: 600 }} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </>
        )}

        <Typography variant="h4" sx={{ mb: 1 }}>
          {t('result.assumptions')}
        </Typography>
        <Box component="ol" sx={{ pl: 2.5, color: '#5f605c', mb: 3, '& li': { mb: 0.5 } }}>
          {e.assumptions.map((a) => (
            <li key={a.key}>{a.text}</li>
          ))}
        </Box>
        {e.warnings.length > 0 && (
          <>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {t('workspace.reports.notes')}
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, color: '#5f605c', mb: 3 }}>
              {e.warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </Box>
          </>
        )}
        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" sx={{ color: '#5f605c' }}>
          {t('workspace.reports.footer', { label: e.classLabel.toLowerCase(), snapshot: e.priceSnapshotId })}{' '}
          {type === 'qs' ? t('workspace.reports.footerQs') : t('workspace.reports.footerClient')}
        </Typography>
      </Box>
    </Box>
  )
}
