import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

function Dashboard() {
  const [stats, setStats] = useState({
    subscriptions: 0,
    teams: 0,
    leads: 0,
    properties: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Check if token exists before making API calls
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.warn('No access token found');
          setLoading(false);
          return;
        }

        // Get user's teamId to fetch team subscription
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        // Fetch basic stats (you can add a stats endpoint later)
        const [subsRes, teamsRes, leadsRes, propsRes] = await Promise.allSettled([
          // Get team subscription if user has teamId
          (user?.teamId 
            ? apiClient.get(`/subscriptions/team/${user.teamId}`).then(res => ({ data: res.data ? [res.data] : [] })).catch(err => {
              if (err.response?.status === 401) {
                throw err;
              }
              // 404 means no subscription yet
              return { data: [] };
            })
            : Promise.resolve({ data: [] })
          ),
          apiClient.get('/teams').catch(err => {
            if (err.response?.status === 401) {
              throw err;
            }
            return { data: [] };
          }),
          apiClient.get('/leads').catch(err => {
            if (err.response?.status === 401) {
              throw err;
            }
            return { data: [] };
          }),
          apiClient.get('/properties').catch(err => {
            if (err.response?.status === 401) {
              throw err;
            }
            return { data: [] };
          }),
        ]);

        setStats({
          subscriptions: subsRes.status === 'fulfilled' ? (subsRes.value.data?.length || 0) : 0,
          teams: teamsRes.status === 'fulfilled' ? (teamsRes.value.data?.length || 0) : 0,
          leads: leadsRes.status === 'fulfilled' ? (leadsRes.value.data?.length || 0) : 0,
          properties: propsRes.status === 'fulfilled' ? (propsRes.value.data?.length || 0) : 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Don't redirect here - let the interceptor handle 401s
        if (error.response?.status !== 401) {
          // Only set loading to false if it's not a 401 (interceptor will handle redirect)
          setLoading(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <h3>Subscriptions</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{stats.subscriptions}</p>
          <Link to="/subscriptions">View all →</Link>
        </div>
        <div className="card">
          <h3>Teams</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.teams}</p>
          <Link to="/teams">View all →</Link>
        </div>
        <div className="card">
          <h3>Leads</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>{stats.leads}</p>
          <Link to="/leads">View all →</Link>
        </div>
        <div className="card">
          <h3>Properties</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{stats.properties}</p>
          <Link to="/properties">View all →</Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

