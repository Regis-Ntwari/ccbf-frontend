import { forwardRef } from 'react'
import { createLink } from '@tanstack/react-router'

import Button from '@mui/material/Button'

const MuiAnchorButton = forwardRef(function MuiAnchorButton(props, ref) {
  return <Button ref={ref} component="a" {...props} />
})

const CreatedLinkButton = createLink(MuiAnchorButton)

/** MUI Button that is a fully typed TanStack Router link (to / params / search). */
export const LinkButton = (props) => <CreatedLinkButton preload="intent" {...props} />
