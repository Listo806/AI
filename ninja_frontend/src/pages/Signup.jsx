import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

function Signup({ setUser }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'owner', // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Available roles matching backend UserRole enum
  const roles = [
    { value: 'owner', label: 'Owner' },
    { value: 'agent', label: 'Agent' },
    { value: 'developer', label: 'Developer' },
    { value: 'admin', label: 'Admin' },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/signup', formData);

      // Store token and user
      // Backend returns accessToken (camelCase), not access_token
      const token = response.data.accessToken || response.data.access_token;
      const userData = response.data.user;
      
      if (!token) {
        console.error('Signup response:', response.data);
        setError('No access token received from server. Check console for details.');
        return;
      }

      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Small delay to ensure localStorage is set
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="card">
        <h2>Sign Up</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;

