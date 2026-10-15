import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { useTranslation } from 'react-i18next'
import { qk } from '@/shared/api/keys'
import { estimateApi } from '@/shared/api/endpoints'
import type { TraceNode } from '@/shared/api/schemas'
import { formatDate, formatMoney, formatNumber } from '@/shared/lib/format'
import { ErrorState, LoadingState } from './States'

/**
 * Click-through traceability (Section 11): formula, inputs, assumptions, waste,
 * price record, last update and author for the figure, with drill-down into children.
 */
export function TraceDrawer({ estimateId, figureId, onClose }: { estimateId: string; figureId: string; onClose: () => void }) {
  const { i18n } = useTranslation()
  const [path, setPath] = useState<TraceNode[]>([])
  const query = useQuery({ queryKey: qk.trace(estimateId, figureId), queryFn: () => estimateApi.trace(estimateId, figureId) })
  const node = path.length ? path[path.length - 1]! : query.data

  const renderValue = (n: TraceNode) => (n.unit === 'RWF' ? formatMoney(n.value, 'RWF', i18n.language) : `${formatNumber(n.value, i18n.language, 2)} ${n.unit}`)

  return (
    <Drawer anchor="right" open onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 440 }, p: 2 } } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h4" component="h2">
          Why this number?
        </Typography>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Stack>
      {query.isPending && <LoadingState inline />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {node && (
        <Box>
          {path.length > 0 && (
            <Breadcrumbs sx={{ mb: 1, fontSize: 13 }}>
              <Link component="button" underline="hover" onClick={() => setPath([])}>
                {query.data?.label}
              </Link>
              {path.map((p, i) => (
                <Link key={p.id} component="button" underline="hover" onClick={() => setPath(path.slice(0, i + 1))}>
                  {p.label}
                </Link>
              ))}
            </Breadcrumbs>
          )}
          <Typography variant="subtitle2" color="text.secondary">
            {node.label}
          </Typography>
          <Typography variant="h3" sx={{ fontVariantNumeric: 'tabular-nums', mb: 1 }}>
            {renderValue(node)}
          </Typography>
          {node.formula && (
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5, fontFamily: 'monospace', fontSize: 13, mb: 2 }}>{node.formula}</Box>
          )}
          <Typography variant="overline">Inputs</Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableBody>
              {node.inputs.map((inp, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ color: 'text.secondary', pl: 0 }}>{inp.name}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', pr: 0 }}>
                    {typeof inp.value === 'number' ? formatNumber(inp.value, i18n.language, 3) : inp.value} {inp.unit ?? ''}
                  </TableCell>
                </TableRow>
              ))}
              {node.wastePct != null && (
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', pl: 0 }}>Waste allowance</TableCell>
                  <TableCell align="right" sx={{ pr: 0 }}>{node.wastePct} %</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {node.assumptions.length > 0 && (
            <>
              <Typography variant="overline">Assumptions</Typography>
              <Box component="ul" sx={{ mt: 0, pl: 2.5, color: 'text.secondary', fontSize: 14 }}>
                {node.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </Box>
            </>
          )}
          {node.price && (
            <>
              <Typography variant="overline">Price record</Typography>
              <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                <Chip size="small" label={node.price.priceId} variant="outlined" />
                <Chip size="small" label={node.price.source} variant="outlined" />
                <Chip size="small" label={formatDate(node.price.sourceDate, i18n.language)} variant="outlined" />
                <Chip size="small" label={`confidence: ${node.price.confidence}`} color={node.price.confidence === 'high' ? 'success' : node.price.confidence === 'medium' ? 'warning' : 'error'} variant="outlined" />
                <Chip size="small" label={node.price.verified ? 'verified' : 'unverified'} color={node.price.verified ? 'success' : 'default'} variant="outlined" />
              </Stack>
            </>
          )}
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Last updated {formatDate(node.lastUpdated, i18n.language)} by {node.changedBy}
          </Typography>
          {node.children.length > 0 && (
            <>
              <Typography variant="overline" sx={{ display: 'block', mt: 2 }}>
                Made of
              </Typography>
              <List dense disablePadding>
                {node.children.map((c) => (
                  <ListItemButton key={c.id} onClick={() => setPath([...path, c])} sx={{ borderRadius: 1 }}>
                    <ListItemText primary={c.label} secondary={renderValue(c)} />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}
        </Box>
      )}
    </Drawer>
  )
}
