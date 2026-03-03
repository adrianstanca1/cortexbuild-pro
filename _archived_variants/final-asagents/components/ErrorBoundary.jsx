import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Caught in ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '20px'}}>
          <h1>Application Error</h1>
          <div style={{background: '#fff', padding: '15px', borderRadius: '5px', marginTop: '10px'}}>
            <h3>Error details:</h3>
            <pre>{this.state.error.toString()}</pre>
            <code>{this.state.error.stack}</code>
          </div>
          <button style={{marginTop: '15px'}} onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;