import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined'
import { TraceDrawer } from './TraceDrawer'

/** "Why this number?" affordance next to any currency figure (Feature 8). */
export function TraceButton({ estimateId, figureId, size = 'small' }: { estimateId: string; figureId: string; size?: 'small' | 'medium' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Tooltip title="Why this number?">
        <IconButton size={size} aria-label="Why this number?" onClick={() => setOpen(true)}>
          <HelpOutlineIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      {open && <TraceDrawer estimateId={estimateId} figureId={figureId} onClose={() => setOpen(false)} />}
    </>
  )
}
