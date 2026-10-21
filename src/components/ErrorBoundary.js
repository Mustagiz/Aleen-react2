import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Refresh, WarningAmber } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: '#0B1313'
          }}
        >
          <Paper
            elevation={6}
            sx={{
              p: 4,
              maxWidth: 520,
              width: '100%',
              borderRadius: 3.5,
              textAlign: 'center',
              bgcolor: 'rgba(16, 26, 26, 0.95)',
              border: '1px solid rgba(15, 118, 110, 0.3)',
              color: '#FFFFFF'
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(217, 119, 6, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5
              }}
            >
              <WarningAmber sx={{ fontSize: 32, color: '#F59E0B' }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#FFFFFF' }}>
              Atelier Notice
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              An unexpected render issue occurred while displaying this page. You can refresh or return to the main atelier dashboard.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={this.handleReload}
                startIcon={<Refresh />}
                sx={{
                  color: '#FFFFFF',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2
                }}
              >
                Refresh View
              </Button>
              <Button
                variant="contained"
                onClick={this.handleReset}
                sx={{
                  bgcolor: '#0F766E',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#0D6860' }
                }}
              >
                Return to Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
