import React, { useState } from "react";

import apiClient from "../../api/apiClient";

export default function CsvLeadImportPage() {
  const [file, setFile] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [data, setData] =
    useState(null);

  const [mapping, setMapping] =
    useState({});

  const [importing, setImporting] =
    useState(false);

  const crmFields = [
    "full_name",
    "email",
    "phone",
    "company",
  ];

  const uploadCsv = async () => {
    try {
      if (!file) return;

      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);

      // Route through apiClient so the request uses the correct base URL and
      // the stored auth token (listo_access_token). apiClient drops the JSON
      // Content-Type automatically for FormData bodies.
      const result = await apiClient.request(
        "/imports/csv-leads/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      setData(result);

      const initial = {};

      (result.columns || []).forEach((c) => {
        initial[c] = "";
      });

      setMapping(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const startImport = async () => {
    try {
      setImporting(true);

      await apiClient.request(
        "/imports/csv-leads/start",
        {
          method: "POST",

          body: JSON.stringify({
            importId:
              data.importId,

            rows: data.rows,

            mapping,
          }),
        },
      );

      alert(
        "CSV leads imported successfully",
      );
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>CSV Lead Import</h1>

        <p>
          Upload and import lead lists
          into your CRM.
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
        <div>
          <h3>Upload CSV</h3>

          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              setFile(
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

        {data && (
          <>
            <div
              style={{
                marginTop: 32,
              }}
            >
              <h3>Column Mapping</h3>

              <div
                style={{
                  display: "grid",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                {data.columns.map(
                  (column) => (
                    <div
                      key={column}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: 16,
                      }}
                    >
                      <div>
                        {column}
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

            <div
              style={{
                marginTop: 32,
              }}
            >
              <h3>CSV Preview</h3>

              <pre
                style={{
                  background:
                    "#f8fafc",
                  padding: 16,
                  borderRadius: 12,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(
                  data.preview,
                  null,
                  2,
                )}
              </pre>
            </div>

            <button
              onClick={startImport}
              disabled={importing}
              style={buttonStyle}
            >
              {importing
                ? "Importing..."
                : "Confirm Import"}
            </button>
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