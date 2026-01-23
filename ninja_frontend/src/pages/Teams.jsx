import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
// import './Teams.css'; // Temporarily commented out - CSS is in global index.css

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [seatInfo, setSeatInfo] = useState(null);
  const [formData, setFormData] = useState({ name: '', seatLimit: undefined });
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchSeatInfo(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/teams');
      setTeams(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeatInfo = async (teamId) => {
    try {
      const response = await apiClient.get(`/teams/${teamId}/seats`);
      setSeatInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch seat info:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      // Prepare payload - ensure seatLimit is a valid integer if provided
      const payload = {
        name: formData.name.trim(),
      };
      
      // Only include seatLimit if it's a valid positive integer
      if (formData.seatLimit !== undefined && formData.seatLimit !== null && formData.seatLimit > 0) {
        payload.seatLimit = parseInt(formData.seatLimit);
      }
      
      console.log('Creating team with payload:', payload);
      const response = await apiClient.post('/teams', payload);
      console.log('Team created:', response.data);
      
      setSuccess('Team created successfully!');
      setShowCreateForm(false);
      setFormData({ name: '', seatLimit: undefined });
      await fetchTeams();
      
      // Update user's teamId if this is their first team
      if (response.data && user && !user.teamId) {
        const updatedUser = { ...user, teamId: response.data.id };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Team creation error:', err);
      const errorMessage = err.response?.data?.message || 
                          (Array.isArray(err.response?.data?.message) 
                            ? err.response.data.message.join(', ') 
                            : 'Failed to create team');
      setError(errorMessage);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await apiClient.put(`/teams/${editingTeam.id}`, formData);
      setSuccess('Team updated successfully!');
      setEditingTeam(null);
      setFormData({ name: '', seatLimit: undefined });
      await fetchTeams();
      if (selectedTeam && selectedTeam.id === editingTeam.id) {
        await fetchSeatInfo(editingTeam.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update team');
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, seatLimit: team.seatLimit });
    setShowCreateForm(false);
    setSelectedTeam(null);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingTeam(null);
    setFormData({ name: '', seatLimit: undefined });
    setSelectedTeam(null);
  };

  const handleViewDetails = async (team) => {
    setSelectedTeam(team);
    setEditingTeam(null);
    setShowCreateForm(false);
    await fetchSeatInfo(team.id);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const userId = e.target.userId.value;
    if (!userId) {
      setError('Please enter a user ID');
      return;
    }
    try {
      setError('');
      setSuccess('');
      await apiClient.post(`/teams/${selectedTeam.id}/members/${userId}`);
      setSuccess('Member added successfully!');
      e.target.reset();
      await fetchSeatInfo(selectedTeam.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await apiClient.delete(`/teams/${selectedTeam.id}/members/${userId}`);
      setSuccess('Member removed successfully!');
      await fetchSeatInfo(selectedTeam.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Teams</h1>
        {!showCreateForm && !editingTeam && (
          <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
            Create Team
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create New Team</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Team Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter team name"
              />
            </div>
            <div className="form-group">
              <label>Seat Limit (Optional)</label>
              <input
                type="number"
                min="1"
                value={formData.seatLimit || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    seatLimit: value === '' ? undefined : parseInt(value) || 1 
                  });
                }}
                placeholder="Number of seats (default: 1)"
              />
              <small>Maximum number of team members (including owner). Leave empty for default (1 seat).</small>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Create Team
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingTeam && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Edit Team: {editingTeam.name}</h3>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Team Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter team name"
              />
            </div>
            <div className="form-group">
              <label>Seat Limit (Optional)</label>
              <input
                type="number"
                min="1"
                value={formData.seatLimit || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    seatLimit: value === '' ? undefined : parseInt(value) || 1 
                  });
                }}
                placeholder="Number of seats"
              />
              <small>Maximum number of team members (including owner). Leave empty for default (1 seat).</small>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Update Team
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Details View */}
      {selectedTeam && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Team Details: {selectedTeam.name}</h3>
            <button onClick={() => setSelectedTeam(null)} className="btn btn-secondary">
              Close
            </button>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Team ID:</strong> {selectedTeam.id}</p>
            <p><strong>Owner ID:</strong> {selectedTeam.ownerId}</p>
            <p><strong>Created:</strong> {new Date(selectedTeam.createdAt).toLocaleString()}</p>
            <p><strong>Updated:</strong> {new Date(selectedTeam.updatedAt).toLocaleString()}</p>
          </div>

          {seatInfo && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <h4>Seat Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '10px' }}>
                <div>
                  <strong>Total Seats:</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{seatInfo.total}</div>
                </div>
                <div>
                  <strong>Used Seats:</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{seatInfo.used}</div>
                </div>
                <div>
                  <strong>Available Seats:</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: seatInfo.available > 0 ? '#ffc107' : '#dc3545' }}>
                    {seatInfo.available}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTeam.ownerId === user?.id && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <h4>Manage Members</h4>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                To add a member, you need their user ID. You can find user IDs from the users list or API.
              </p>
              <form onSubmit={handleAddMember} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    name="userId"
                    placeholder="Enter user ID"
                    required
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={seatInfo && seatInfo.available <= 0}>
                    Add Member
                  </button>
                </div>
                {seatInfo && seatInfo.available <= 0 && (
                  <small style={{ color: '#dc3545' }}>No available seats. Increase seat limit to add more members.</small>
                )}
              </form>
              <p style={{ fontSize: '14px', color: '#666' }}>
                <em>Note: Member management requires user IDs. A members list endpoint would be helpful here.</em>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Teams List */}
      {!showCreateForm && !editingTeam && !selectedTeam && (
        <>
          {teams.length === 0 ? (
            <div className="card">
              <p>No teams found. Create your first team to get started!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Seat Limit</th>
                    <th>Owner</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <strong>{team.name}</strong>
                        {team.id === user?.teamId && (
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#28a745' }}>(Current Team)</span>
                        )}
                      </td>
                      <td>{team.seatLimit}</td>
                      <td>
                        {team.ownerId === user?.id ? (
                          <span style={{ color: '#007bff' }}>You</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#666' }}>{team.ownerId.substring(0, 8)}...</span>
                        )}
                      </td>
                      <td>{new Date(team.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleViewDetails(team)}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Details
                          </button>
                          {team.ownerId === user?.id && (
                            <button
                              onClick={() => handleEdit(team)}
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Teams;
