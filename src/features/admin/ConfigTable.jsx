import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { FONT_MONO } from '@/shared/theme/theme'
import { LocaleDots, LocalizedTextField } from './LocalizedTextField'

const Unit = ({ children }) => (
  <span style={{ fontSize: 12, color: 'var(--mui-palette-text-secondary)', marginLeft: 4 }}>{children}</span>
)

/**
 * Generic editable table for configuration arrays: text / localized / number /
 * money / percent / boolean / select cells. `lang` is the content language a
 * `localized` cell edits; `locales` the languages shown in its completeness marker.
 */
export function ConfigTable({ rows, columns, onChange, onRemove, rowKey, lang = 'en', locales }) {
  const { t } = useTranslation()
  const update = (i, key, value) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))
  return (
    <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell
                key={c.key}
                align={c.kind === 'number' || c.kind === 'money' || c.kind === 'percent' ? 'right' : 'left'}
                sx={{ width: c.width }}
              >
                {c.label}
              </TableCell>
            ))}
            {onRemove && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={rowKey(row, i)}>
              {columns.map((c) => {
                const raw = row[c.key]
                const numeric = c.kind === 'number' || c.kind === 'money' || c.kind === 'percent'
                return (
                  <TableCell key={c.key} align={numeric ? 'right' : 'left'} sx={{ py: 0.5, verticalAlign: 'middle' }}>
                    {c.kind === 'readonly' && <span style={{ fontFamily: FONT_MONO }}>{String(raw ?? '')}</span>}
                    {c.kind === 'localized' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocalizedTextField
                          fullWidth
                          value={raw}
                          lang={lang}
                          locales={locales}
                          onChange={(v) => update(i, c.key, v)}
                          slotProps={{ htmlInput: { 'aria-label': c.label } }}
                        />
                        <LocaleDots value={raw} locales={locales} />
                      </Box>
                    )}
                    {c.kind === 'text' && (
                      <TextField
                        fullWidth
                        value={String(raw ?? '')}
                        onChange={(e) => update(i, c.key, e.target.value)}
                        slotProps={{ htmlInput: { 'aria-label': c.label } }}
                      />
                    )}
                    {numeric && (
                      <TextField
                        type="number"
                        value={
                          raw == null ? '' : c.kind === 'percent' && c.fraction ? Number((raw * 100).toFixed(4)) : raw
                        }
                        placeholder={c.nullable ? '—' : undefined}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '' && c.nullable) return update(i, c.key, null)
                          const n = Number(v)
                          update(i, c.key, c.kind === 'percent' && c.fraction ? n / 100 : n)
                        }}
                        slotProps={{
                          htmlInput: {
                            step: c.step ?? (c.kind === 'percent' ? 0.5 : 1),
                            min: 0,
                            'aria-label': c.label,
                            style: { textAlign: 'right', fontFamily: FONT_MONO },
                          },
                          input: {
                            endAdornment:
                              c.kind === 'percent' ? <Unit>%</Unit> : c.kind === 'money' ? <Unit>RWF</Unit> : undefined,
                          },
                        }}
                        sx={{ minWidth: c.width ?? 120 }}
                      />
                    )}
                    {c.kind === 'boolean' && (
                      <Switch
                        size="small"
                        checked={Boolean(raw)}
                        onChange={(e) => update(i, c.key, e.target.checked)}
                        slotProps={{ input: { 'aria-label': c.label } }}
                      />
                    )}
                    {c.kind === 'select' && (
                      <TextField
                        select
                        fullWidth
                        value={raw == null ? '' : String(raw)}
                        onChange={(e) => update(i, c.key, e.target.value === '' ? null : e.target.value)}
                        sx={{ minWidth: c.width ?? 140 }}
                      >
                        {c.nullable && <MenuItem value="">—</MenuItem>}
                        {(c.options ?? []).map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </TableCell>
                )
              })}
              {onRemove && (
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <IconButton size="small" aria-label={t('admin.config.removeRow')} onClick={() => onRemove(i)}>
                    <DeleteOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
