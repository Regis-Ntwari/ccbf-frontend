import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import type { Assumption, EstimateWarning } from '@/shared/api/schemas'

export function AssumptionsPanel({ assumptions, title = 'Assumptions' }: { assumptions: Assumption[]; title?: string }) {
  return (
    <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <List dense disablePadding>
          {assumptions.map((a) => (
            <ListItem key={a.key} disableGutters>
              <ListItemText primary={a.text} secondary={a.source} />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  )
}

export function WarningsList({ warnings }: { warnings: EstimateWarning[] }) {
  if (!warnings.length) return null
  return (
    <Stack spacing={1}>
      {warnings.map((w, i) => (
        <Alert key={i} severity={w.blocksProfessionalExport ? 'error' : 'warning'} variant="outlined">
          {w.message}
        </Alert>
      ))}
    </Stack>
  )
}
