import React from 'react';

interface State { failed: boolean }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('Ample LMS render error:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--navy-dark)' }}>This page failed to load</h1>
          <p style={{ margin: '.75rem 0 1.5rem', color: 'var(--text-secondary)' }}>
            Reload the page to try again. Your progress is saved on this device.
          </p>
          <button className="ample-btn-primary" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </div>
    );
  }
}
