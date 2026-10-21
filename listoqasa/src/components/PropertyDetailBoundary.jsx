import React from 'react';
import { Link, useLocation } from 'react-router-dom';

class DetailErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[Property detail render]', error, info); }
  componentDidUpdate(prevProps) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <div style={{ padding: '90px 24px', maxWidth: 800, margin: 'auto', color: '#123' }}>
      <h2>Unable to display this property</h2>
      <p>The property page encountered an unexpected error. Please try again.</p>
      <button type="button" onClick={() => this.setState({ error: null })}>Try again</button>
      {' '}<Link to="/buy">Back to search</Link>
    </div>;
  }
}
export default function PropertyDetailBoundary({ children }) {
  const location = useLocation();
  return <DetailErrorBoundary routeKey={location.pathname}>{children}</DetailErrorBoundary>;
}
