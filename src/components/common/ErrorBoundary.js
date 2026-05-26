import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to a logging service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRefresh = () => {
    // Clear error state and try to recover
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false
    });
    
    // Optionally reload the page for full recovery
    if (this.props.reloadOnError) {
      window.location.reload();
    }
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      const { fallback: FallbackComponent, title, message } = this.props;
      
      if (FallbackComponent) {
        return <FallbackComponent 
          error={this.state.error} 
          resetError={this.handleRefresh}
        />;
      }

      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 4, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
            }}
          >
            <ErrorIcon 
              sx={{ 
                fontSize: 64, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
              {title || 'Oops! Something went wrong'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message || 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRefresh}
                size="large"
              >
                Try Again
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<BugReportIcon />}
                onClick={() => window.location.href = 'mailto:support@reyanshelectronics.com?subject=Error Report'}
                size="large"
              >
                Report Issue
              </Button>
            </Box>

            {/* Error Details (for development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert severity="error" sx={{ textAlign: 'left', mt: 3 }}>
                <AlertTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Development Error Details
                    <IconButton 
                      size="small" 
                      onClick={this.toggleDetails}
                      sx={{ ml: 2 }}
                    >
                      {this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </AlertTitle>
                
                <Collapse in={this.state.showDetails}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Error Message:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        bgcolor: 'grey.100', 
                        p: 1, 
                        borderRadius: 1,
                        mb: 2
                      }}
                    >
                      {this.state.error.toString()}
                    </Typography>
                    
                    {this.state.errorInfo && (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Component Stack:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            bgcolor: 'grey.100', 
                            p: 1, 
                            borderRadius: 1,
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.75rem'
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Collapse>
              </Alert>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = () => setError(null);

  const captureError = (error) => {
    console.error('Captured error:', error);
    setError(error);
  };

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError, error };
};

export default ErrorBoundary;
