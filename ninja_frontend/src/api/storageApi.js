import apiClient from './apiClient';

/**
 * Storage API Service
 * Handles all file upload and storage-related API calls
 */

/**
 * Upload a file
 * @param {File} file - The file to upload
 * @param {string} folder - Optional folder path
 * @param {string} teamId - Optional team ID
 * @returns {Promise} Response with file metadata
 */
export const uploadFile = async (file, folder = null, teamId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);
  if (teamId) formData.append('teamId', teamId);

  const response = await apiClient.post('/integrations/storage/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * List files
 * @param {string} teamId - Optional team ID filter
 * @param {string} folder - Optional folder filter
 * @returns {Promise} Response with files array and count
 */
export const listFiles = async (teamId = null, folder = null) => {
  const params = new URLSearchParams();
  if (teamId) params.append('teamId', teamId);
  if (folder) params.append('folder', folder);

  const url = params.toString() 
    ? `/integrations/storage/files?${params.toString()}`
    : '/integrations/storage/files';
  
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Get file metadata
 * @param {string} fileId - File ID
 * @returns {Promise} Response with file metadata
 */
export const getFileMetadata = async (fileId) => {
  const response = await apiClient.get(`/integrations/storage/files/${fileId}`);
  return response.data;
};

/**
 * Get signed URL for file access
 * @param {string} fileId - File ID
 * @param {number} expiresIn - URL expiration in seconds (default: 3600)
 * @returns {Promise} Response with signed URL
 */
export const getFileUrl = async (fileId, expiresIn = 3600) => {
  const response = await apiClient.get(
    `/integrations/storage/files/${fileId}/url?expiresIn=${expiresIn}`
  );
  return response.data;
};

/**
 * Delete a file
 * @param {string} fileId - File ID
 * @returns {Promise} Response with success message
 */
export const deleteFile = async (fileId) => {
  const response = await apiClient.delete(`/integrations/storage/files/${fileId}`);
  return response.data;
};
