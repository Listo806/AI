import React, { useState } from "react";

import apiClient from "../../api/apiClient";

export default function CrmImportPage() {
  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [importData, setImportData] =
    useState(null);

  const [mapping, setMapping] =
    useState({});

  const [duplicateStrategy, setDuplicateStrategy] =
    useState("skip");

  const [importing, setImporting] =
    useState(false);

  const crmFields = [
    "full_name",
    "email",
    "phone",
    "company",
    "pipeline",
    "notes",
  ];

  const uploadCsv = async () => {
    try {
      if (!selectedFile) {
        return;
      }

      setUploading(true);

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/integrations/crm-import/upload`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token",
            )}`,
          },

          body: formData,
        },
      );

      const data =
        await response.json();

      setImportData(data);

      const initialMapping = {};

      data.columns.forEach((column) => {
        initialMapping[column] = "";
      });

      setMapping(initialMapping);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const saveMapping = async () => {
    try {
      await apiClient.request(
        `/integrations/crm-import/${importData.importId}/mapping`,
        {
          method: "POST",

          body: JSON.stringify({
            mapping,

            duplicateStrategy,
          }),
        },
      );

      alert("Mapping saved");
    } catch (err) {
      console.error(err);
    }
  };

  const startImport = async () => {
    try {
      setImporting(true);

      await apiClient.request(
        `/integrations/crm-import/${importData.importId}/start`,
        {
          method: "POST",
        },
      );

      alert("Import completed");
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>CRM Import Tool</h1>

        <p>
          Import contacts, leads, and CRM
          data from CSV or external CRMs.
        </p>
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
        <div style={{ marginBottom: 32 }}>
          <h3>Import Source</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              marginTop: 16,
            }}
          >
            {[
              "HubSpot",
              "Salesforce",
              "Zoho",
              "Pipedrive",
              "CSV Upload",
            ].map((crm) => (
              <div
                key={crm}
                style={{
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                <strong>{crm}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3>Upload CSV File</h3>

          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              setSelectedFile(
                e.target.files[0],
              )
            }
          />

          <button
            onClick={uploadCsv}
            disabled={uploading}
            style={buttonStyle}
          >
            {uploading
              ? "Uploading..."
              : "Upload CSV"}
          </button>
        </div>

        {importData && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h3>Column Mapping</h3>

              <div
                style={{
                  display: "grid",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                {importData.columns.map(
                  (column) => (
                    <div
                      key={column}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: 16,
                        alignItems:
                          "center",
                      }}
                    >
                      <div>
                        <strong>
                          {column}
                        </strong>
                      </div>

                      <select
                        value={
                          mapping[column]
                        }
                        onChange={(e) =>
                          setMapping({
                            ...mapping,
                            [column]:
                              e.target
                                .value,
                          })
                        }
                        style={{
                          padding: 10,
                          borderRadius: 10,
                        }}
                      >
                        <option value="">
                          Ignore
                        </option>

                        {crmFields.map(
                          (field) => (
                            <option
                              key={field}
                              value={field}
                            >
                              {field}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h3>
                Duplicate Handling
              </h3>

              <select
                value={
                  duplicateStrategy
                }
                onChange={(e) =>
                  setDuplicateStrategy(
                    e.target.value,
                  )
                }
                style={{
                  padding: 10,
                  borderRadius: 10,
                  marginTop: 16,
                }}
              >
                <option value="skip">
                  Skip duplicates
                </option>

                <option value="overwrite">
                  Overwrite existing
                </option>

                <option value="merge">
                  Merge records
                </option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
              }}
            >
              <button
                onClick={saveMapping}
                style={buttonStyle}
              >
                Save Mapping
              </button>

              <button
                onClick={startImport}
                disabled={importing}
                style={buttonStyle}
              >
                {importing
                  ? "Importing..."
                  : "Start Import"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  marginTop: 16,
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
};