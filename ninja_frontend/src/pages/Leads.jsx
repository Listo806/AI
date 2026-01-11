import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const LeadStatus = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  LOST: 'lost',
};

const STATUS_COLORS = {
  new: { bg: '#d1ecf1', color: '#0c5460' },
  contacted: { bg: '#fff3cd', color: '#856404' },
  qualified: { bg: '#d4edda', color: '#155724' },
  converted: { bg: '#c3e6cb', color: '#155724' },
  lost: { bg: '#f8d7da', color: '#721c24' },
};

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: LeadStatus.NEW,
    assignedTo: '',
    notes: '',
    source: '',
  });

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const url = statusFilter ? `/leads?status=${statusFilter}` : '/leads';
      const response = await apiClient.get(url);
      setLeads(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      // Prepare payload - only include non-empty fields
      const payload = {
        name: formData.name.trim(),
        ...(formData.email?.trim() ? { email: formData.email.trim() } : {}),
        ...(formData.phone?.trim() ? { phone: formData.phone.trim() } : {}),
        ...(formData.status ? { status: formData.status } : {}),
        ...(formData.assignedTo?.trim() ? { assignedTo: formData.assignedTo.trim() } : {}),
        ...(formData.notes?.trim() ? { notes: formData.notes.trim() } : {}),
        ...(formData.source?.trim() ? { source: formData.source.trim() } : {}),
      };
      
      console.log('Creating lead with payload:', payload);
      const response = await apiClient.post('/leads', payload);
      console.log('Lead created:', response.data);
      
      setSuccess('Lead created successfully!');
      setShowCreateForm(false);
      resetForm();
      await fetchLeads();
    } catch (err) {
      console.error('Lead creation error:', err);
      const errorMessage = err.response?.data?.message || 
                          (Array.isArray(err.response?.data?.message) 
                            ? err.response.data.message.join(', ') 
                            : 'Failed to create lead');
      setError(errorMessage);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      // Prepare payload - only include changed fields
      const payload = {};
      if (formData.name.trim() !== editingLead.name) {
        payload.name = formData.name.trim();
      }
      if (formData.email?.trim() !== (editingLead.email || '')) {
        payload.email = formData.email?.trim() || null;
      }
      if (formData.phone?.trim() !== (editingLead.phone || '')) {
        payload.phone = formData.phone?.trim() || null;
      }
      if (formData.status !== editingLead.status) {
        payload.status = formData.status;
      }
      if (formData.assignedTo?.trim() !== (editingLead.assignedTo || '')) {
        payload.assignedTo = formData.assignedTo?.trim() || null;
      }
      if (formData.notes?.trim() !== (editingLead.notes || '')) {
        payload.notes = formData.notes?.trim() || null;
      }
      if (formData.source?.trim() !== (editingLead.source || '')) {
        payload.source = formData.source?.trim() || null;
      }
      
      if (Object.keys(payload).length === 0) {
        setError('No changes to update');
        return;
      }
      
      console.log('Updating lead with payload:', payload);
      await apiClient.put(`/leads/${editingLead.id}`, payload);
      setSuccess('Lead updated successfully!');
      setEditingLead(null);
      resetForm();
      await fetchLeads();
      if (selectedLead && selectedLead.id === editingLead.id) {
        setSelectedLead(null);
      }
    } catch (err) {
      console.error('Lead update error:', err);
      const errorMessage = err.response?.data?.message || 
                          (Array.isArray(err.response?.data?.message) 
                            ? err.response.data.message.join(', ') 
                            : 'Failed to update lead');
      setError(errorMessage);
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await apiClient.delete(`/leads/${leadId}`);
      setSuccess('Lead deleted successfully!');
      await fetchLeads();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      status: lead.status || LeadStatus.NEW,
      assignedTo: lead.assignedTo || '',
      notes: lead.notes || '',
      source: lead.source || '',
    });
    setShowCreateForm(false);
    setSelectedLead(null);
  };

  const handleViewDetails = async (leadId) => {
    try {
      const response = await apiClient.get(`/leads/${leadId}`);
      setSelectedLead(response.data);
      setEditingLead(null);
      setShowCreateForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lead details');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: LeadStatus.NEW,
      assignedTo: '',
      notes: '',
      source: '',
    });
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingLead(null);
    setSelectedLead(null);
    resetForm();
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.new;
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Leads</h1>
        {!showCreateForm && !editingLead && (
          <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
            Create Lead
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Status Filter */}
      {!showCreateForm && !editingLead && !selectedLead && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontWeight: '500' }}>Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
          >
            <option value="">All Leads</option>
            <option value={LeadStatus.NEW}>New</option>
            <option value={LeadStatus.CONTACTED}>Contacted</option>
            <option value={LeadStatus.QUALIFIED}>Qualified</option>
            <option value={LeadStatus.CONVERTED}>Converted</option>
            <option value={LeadStatus.LOST}>Lost</option>
          </select>
          <span style={{ color: '#666', fontSize: '14px' }}>
            Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create New Lead</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter lead name"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value={LeadStatus.NEW}>New</option>
                  <option value={LeadStatus.CONTACTED}>Contacted</option>
                  <option value={LeadStatus.QUALIFIED}>Qualified</option>
                  <option value={LeadStatus.CONVERTED}>Converted</option>
                  <option value={LeadStatus.LOST}>Lost</option>
                </select>
              </div>
              <div className="form-group">
                <label>Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Website, Referral, Social Media"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Assigned To (User ID)</label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Enter user ID (optional)"
              />
              <small style={{ color: '#666' }}>Note: User ID is required. A user lookup feature would be helpful here.</small>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="4"
                placeholder="Additional notes about this lead"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Create Lead
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingLead && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Edit Lead: {editingLead.name}</h3>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter lead name"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value={LeadStatus.NEW}>New</option>
                  <option value={LeadStatus.CONTACTED}>Contacted</option>
                  <option value={LeadStatus.QUALIFIED}>Qualified</option>
                  <option value={LeadStatus.CONVERTED}>Converted</option>
                  <option value={LeadStatus.LOST}>Lost</option>
                </select>
              </div>
              <div className="form-group">
                <label>Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Website, Referral, Social Media"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Assigned To (User ID)</label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Enter user ID (optional)"
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="4"
                placeholder="Additional notes about this lead"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Update Lead
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lead Details View */}
      {selectedLead && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Lead Details: {selectedLead.name}</h3>
            <button onClick={() => setSelectedLead(null)} className="btn btn-secondary">
              Close
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <p><strong>Lead ID:</strong> {selectedLead.id}</p>
              <p><strong>Name:</strong> {selectedLead.name}</p>
              <p><strong>Email:</strong> {selectedLead.email || '-'}</p>
              <p><strong>Phone:</strong> {selectedLead.phone || '-'}</p>
            </div>
            <div>
              <p><strong>Status:</strong> 
                <span
                  style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(selectedLead.status).bg,
                    color: getStatusColor(selectedLead.status).color,
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {selectedLead.status}
                </span>
              </p>
              <p><strong>Source:</strong> {selectedLead.source || '-'}</p>
              <p><strong>Assigned To:</strong> {selectedLead.assignedTo || 'Unassigned'}</p>
              <p><strong>Created By:</strong> {selectedLead.createdBy?.substring(0, 8)}...</p>
            </div>
          </div>
          
          {selectedLead.notes && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <strong>Notes:</strong>
              <p style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>{selectedLead.notes}</p>
            </div>
          )}
          
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #ddd', fontSize: '14px', color: '#666' }}>
            <p><strong>Created:</strong> {new Date(selectedLead.createdAt).toLocaleString()}</p>
            <p><strong>Updated:</strong> {new Date(selectedLead.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Leads List */}
      {!showCreateForm && !editingLead && !selectedLead && (
        <>
          {leads.length === 0 ? (
            <div className="card">
              <p>No leads found. {statusFilter ? 'Try changing the status filter.' : 'Create your first lead to get started!'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td><strong>{lead.name}</strong></td>
                      <td>{lead.email || '-'}</td>
                      <td>{lead.phone || '-'}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: getStatusColor(lead.status).bg,
                            color: getStatusColor(lead.status).color,
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td>{lead.source || '-'}</td>
                      <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleViewDetails(lead.id)}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleEdit(lead)}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="btn btn-sm btn-danger"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Delete
                          </button>
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

export default Leads;
