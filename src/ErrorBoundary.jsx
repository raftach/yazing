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
        <div className="empty" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
          <b>Κάτι πήγε στραβά</b>
          <span>Τα δεδομένα σας δεν επηρεάζονται. Σφάλμα: {this.state.error?.message || 'Άγνωστο σφάλμα'}</span>
          <button className="btn btn-go" onClick={() => window.location.reload()}>Επανεκκίνηση</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
