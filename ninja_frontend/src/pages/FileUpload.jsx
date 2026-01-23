import { useState, useEffect } from 'react';
import {
  uploadFile,
  listFiles,
  getFileMetadata,
  getFileUrl,
  deleteFile,
} from '../api/storageApi';

function FileUpload() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileMetadata, setFileMetadata] = useState(null);
  const [fileUrl, setFileUrl] = useState('');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    folder: '',
    teamId: '',
  });

  // List filters
  const [filters, setFilters] = useState({
    teamId: '',
    folder: '',
  });

  useEffect(() => {
    fetchFiles();
  }, [filters]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await listFiles(
        filters.teamId || null,
        filters.folder || null
      );
      // The API returns an array directly, not an object with files property
      setFiles(Array.isArray(result) ? result : (Array.isArray(result.files) ? result.files : []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const result = await uploadFile(
        uploadForm.file,
        uploadForm.folder || null,
        uploadForm.teamId || null
      );
      setSuccess(`File "${result.originalName || result.fileName}" uploaded successfully!`);
      
      // Clear the upload form
      setUploadForm({ file: null, folder: '', teamId: '' });
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
      // Update filters to match the uploaded file so it appears in the list
      // This ensures the newly uploaded file will be visible
      const newFilters = {
        teamId: result.teamId ? result.teamId : (filters.teamId || ''),
        folder: result.folder ? result.folder : (filters.folder || ''),
      };
      
      // Update filters (useEffect will trigger fetchFiles automatically)
      setFilters(newFilters);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleViewMetadata = async (fileId) => {
    try {
      setError('');
      setSuccess('');
      const metadata = await getFileMetadata(fileId);
      setFileMetadata(metadata);
      setSelectedFile(fileId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get file metadata');
      setFileMetadata(null);
    }
  };

  const handleGetUrl = async (fileId, expiresIn = 3600) => {
    try {
      setError('');
      setSuccess('');
      const result = await getFileUrl(fileId, expiresIn);
      setFileUrl(result.url || result);
      setSuccess('Signed URL generated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get file URL');
      setFileUrl('');
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await deleteFile(fileId);
      setSuccess('File deleted successfully!');
      if (selectedFile === fileId) {
        setSelectedFile(null);
        setFileMetadata(null);
        setFileUrl('');
      }
      await fetchFiles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>File Upload & Storage Test</h1>
        <button onClick={fetchFiles} className="btn btn-secondary" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Files'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Upload Section */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Upload File</h3>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>File *</label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              required
            />
            {uploadForm.file && (
              <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
                Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Folder (optional)</label>
              <input
                type="text"
                value={uploadForm.folder}
                onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value })}
                placeholder="properties, documents, etc."
              />
            </div>
            <div className="form-group">
              <label>Team ID (optional)</label>
              <input
                type="text"
                value={uploadForm.teamId}
                onChange={(e) => setUploadForm({ ...uploadForm, teamId: e.target.value })}
                placeholder="team-uuid"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading || !uploadForm.file}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Filter Files</h3>
          {(filters.teamId || filters.folder) && (
            <button
              onClick={() => setFilters({ teamId: '', folder: '' })}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="form-group">
            <label>Team ID</label>
            <input
              type="text"
              value={filters.teamId}
              onChange={(e) => setFilters({ ...filters, teamId: e.target.value })}
              placeholder="Filter by team ID"
            />
          </div>
          <div className="form-group">
            <label>Folder</label>
            <input
              type="text"
              value={filters.folder}
              onChange={(e) => setFilters({ ...filters, folder: e.target.value })}
              placeholder="Filter by folder"
            />
          </div>
        </div>
      </div>

      {/* File Metadata View */}
      {fileMetadata && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>File Metadata</h3>
            <button onClick={() => { setFileMetadata(null); setSelectedFile(null); setFileUrl(''); }} className="btn btn-secondary">
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div><strong>ID:</strong> {fileMetadata.id}</div>
            <div><strong>Original Name:</strong> {fileMetadata.originalName}</div>
            <div><strong>File Name:</strong> {fileMetadata.fileName}</div>
            <div><strong>MIME Type:</strong> {fileMetadata.mimeType}</div>
            <div><strong>Size:</strong> {formatFileSize(fileMetadata.size)}</div>
            <div><strong>Folder:</strong> {fileMetadata.folder || 'N/A'}</div>
            <div><strong>URL:</strong> 
              <a href={fileMetadata.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '5px', color: '#007bff' }}>
                {fileMetadata.url?.substring(0, 50)}...
              </a>
            </div>
            <div><strong>Created:</strong> {new Date(fileMetadata.createdAt).toLocaleString()}</div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={() => handleGetUrl(fileMetadata.id)}
              className="btn btn-primary"
              style={{ marginRight: '10px' }}
            >
              Get Signed URL (1 hour)
            </button>
            <button
              onClick={() => handleGetUrl(fileMetadata.id, 86400)}
              className="btn btn-secondary"
            >
              Get Signed URL (24 hours)
            </button>
          </div>
          {fileUrl && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <strong>Signed URL:</strong>
              <div style={{ marginTop: '5px', wordBreak: 'break-all' }}>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                  {fileUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Files List */}
      <div className="card">
        <h3>Uploaded Files ({files.length})</h3>
        {loading && files.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading files...</div>
        ) : files.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No files found. Upload your first file to get started!
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: '15px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Original Name</th>
                  <th>File Name</th>
                  <th>MIME Type</th>
                  <th>Size</th>
                  <th>Folder</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td><strong>{file.originalName}</strong></td>
                    <td>{file.fileName}</td>
                    <td>{file.mimeType}</td>
                    <td>{formatFileSize(file.size)}</td>
                    <td>{file.folder || '-'}</td>
                    <td>{new Date(file.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleViewMetadata(file.id)}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          View
                        </button>
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '12px', padding: '4px 8px', textDecoration: 'none' }}
                          >
                            Open
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(file.id, file.originalName)}
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
      </div>
    </div>
  );
}

export default FileUpload;
