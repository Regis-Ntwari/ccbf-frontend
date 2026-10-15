import { Link } from '@tanstack/react-router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

export function NotFound() {
  return (
    <Box sx={{ textAlign: 'center', py: 10, px: 2 }}>
      <Typography variant="h2" gutterBottom>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        The page you are looking for does not exist or has moved.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Back to home
      </Button>
    </Box>
  )
}
