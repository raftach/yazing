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
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#f87171', background: '#0a0d14', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '10px' }}>Κάτι πήγε στραβά (Something went wrong)</h2>
          <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '20px' }}>
            Σφάλμα: {this.state.error?.message || "Άγνωστο σφάλμα"}
          </p>
          <button 
            style={{ padding: '10px 20px', background: '#4f8ef7', color: 'white', border: 'none', borderRadius: '8px' }}
            onClick={() => window.location.reload()}
          >
            Ανανέωση Σελίδας
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
