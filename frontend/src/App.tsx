import { Box, Typography, Container, Paper } from '@mui/material'

function App() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Hello World!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Spotter AI — Weather-Aware Truck Routing
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default App
