import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/apiClient";

export default function GoogleDrivePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  const [savingFolder, setSavingFolder] = useState(false);

  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const uploadFile = async () => {
    try {
      if (!selectedFile) {
        return;
      }

      if (!status?.integration?.root_folder_id) {
        alert(t("integrations.googleDrive.selectFolderFirst"));
        return;
      }

      setUploading(true);

      const formData = new FormData();

      formData.append("file", selectedFile);

      await fetch(
        `${import.meta.env.VITE_API_URL}/integrations/google-drive/upload/${
          status.integration.root_folder_id
        }`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );

      alert(t("integrations.googleDrive.fileUploaded"));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const loadStatus = async () => {
    try {
      setLoading(true);

      const res = await apiClient.request(
        "/integrations/google-drive/config/status",
      );

      setStatus(res);

      if (res?.isConfigured) {
        await loadFolders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      setFoldersLoading(true);

      const res = await apiClient.request("/integrations/google-drive/folders");

      setFolders(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFoldersLoading(false);
    }
  };

  const connectGoogleDrive = async () => {
    try {
      const res = await apiClient.request(
        "/integrations/google-drive/connect",
      );

      window.location.href = res.url;
    } catch (err) {
      console.error(err);
    }
  };

  const selectFolder = async (folder) => {
    try {
      setSavingFolder(true);

      await apiClient.request("/integrations/google-drive/select-folder", {
        method: "POST",
        body: JSON.stringify({
          folderId: folder.id,
          folderName: folder.name,
        }),
      });

      await loadStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFolder(false);
    }
  };

  const toggleSync = async () => {
    try {
      setSyncLoading(true);

      await apiClient.request("/integrations/google-drive/toggle-sync", {
        method: "POST",
        body: JSON.stringify({
          enabled: !status.integration?.sync_enabled,
        }),
      });

      await loadStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>{t("integrations.googleDrive.loading")}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t("integrations.googleDrive.title")}</h1>

        <p>{t("integrations.googleDrive.subtitle")}</p>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #e5e7eb",
          marginTop: 24,
        }}
      >
        {!status?.isConfigured ? (
          <div>
            <h3>{t("integrations.googleDrive.notConnected")}</h3>

            <button onClick={connectGoogleDrive} style={buttonStyle}>
              {t("integrations.googleDrive.connect")}
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h3>{t("integrations.googleDrive.connectedAccount")}</h3>

              <p>{status.integration?.google_email || "-"}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3>{t("integrations.googleDrive.selectedSyncFolder")}</h3>

              <p>
                {status.integration?.root_folder_name ||
                  t("integrations.googleDrive.noFolderSelected")}
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3>{t("integrations.googleDrive.autoSync")}</h3>

              <button
                onClick={toggleSync}
                disabled={syncLoading}
                style={buttonStyle}
              >
                {status.integration?.sync_enabled
                  ? t("integrations.googleDrive.disableSync")
                  : t("integrations.googleDrive.enableSync")}
              </button>
            </div>

            <div>
              <h3>{t("integrations.googleDrive.selectFolder")}</h3>

              {foldersLoading ? (
                <p>{t("integrations.googleDrive.loadingFolders")}</p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{folder.name}</strong>
                      </div>

                      <button
                        onClick={() => selectFolder(folder)}
                        disabled={savingFolder}
                        style={buttonStyle}
                      >
                        {t("integrations.googleDrive.select")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: 32 }}>
              <h3>{t("integrations.googleDrive.uploadFile")}</h3>

              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />

              <button
                onClick={uploadFile}
                disabled={uploading}
                style={buttonStyle}
              >
                {uploading
                  ? t("integrations.googleDrive.uploading")
                  : t("integrations.googleDrive.uploadToGoogleDrive")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  marginTop: 12,
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
};
