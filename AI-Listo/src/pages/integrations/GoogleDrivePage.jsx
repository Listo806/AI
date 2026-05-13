import React, { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";

export default function GoogleDrivePage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);

      const res = await apiClient.request(
        "/integrations/google-drive/config/status",
      );

      setStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Google Drive Integration</h1>

        <p>
          Connect Google Drive to store contracts,
          property documents, and client files.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          marginTop: 24,
        }}
      >
        {loading ? (
          <p>Loading...</p>
        ) : status?.isConfigured ? (
          <div>
            <p>
              <strong>Status:</strong> Connected
            </p>

            <p>
              <strong>Google Account:</strong>{" "}
              {status.integration?.google_email || "-"}
            </p>

            <p>
              <strong>Root Folder:</strong>{" "}
              {status.integration?.root_folder_id || "-"}
            </p>
          </div>
        ) : (
          <div>
            <p>Google Drive is not connected yet.</p>

            <button
              style={{
                marginTop: 16,
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
              }}
            >
              Connect Google Drive
            </button>
          </div>
        )}
      </div>
    </div>
  );
}