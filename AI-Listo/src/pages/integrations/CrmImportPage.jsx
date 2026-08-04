import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import apiClient from "../../api/apiClient";

export default function CrmImportPage() {
  const { t } = useTranslation();

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

      // Route through apiClient so the request uses the correct base URL and
      // the stored auth token (listo_access_token). apiClient drops the JSON
      // Content-Type automatically for FormData bodies.
      const data = await apiClient.request(
        "/integrations/crm-import/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      setImportData(data);

      const initialMapping = {};

      (data.columns || []).forEach((column) => {
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

      alert(t("integrations.crmImport.mappingSaved"));
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

      alert(t("integrations.crmImport.importCompleted"));
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t("integrations.crmImport.title")}</h1>

        <p>{t("integrations.crmImport.description")}</p>
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
          <h3>{t("integrations.crmImport.importSource")}</h3>

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
            ].map((crm) => {
              const available = crm === "CSV Upload";
              return (
                <div
                  key={crm}
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 16,
                    textAlign: "center",
                    opacity: available ? 1 : 0.55,
                  }}
                >
                  <strong>{crm}</strong>
                  {!available && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        marginTop: 4,
                      }}
                    >
                      {t("integrations.comingSoon")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3>{t("integrations.crmImport.uploadCsvFile")}</h3>

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
              ? t("integrations.crmImport.uploading")
              : t("integrations.crmImport.uploadCsv")}
          </button>
        </div>

        {importData && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h3>{t("integrations.crmImport.columnMapping")}</h3>

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
                          {t("integrations.crmImport.ignore")}
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
                {t("integrations.crmImport.duplicateHandling")}
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
                  {t("integrations.crmImport.skipDuplicates")}
                </option>

                <option value="overwrite">
                  {t("integrations.crmImport.overwriteExisting")}
                </option>

                <option value="merge">
                  {t("integrations.crmImport.mergeRecords")}
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
                {t("integrations.crmImport.saveMapping")}
              </button>

              <button
                onClick={startImport}
                disabled={importing}
                style={buttonStyle}
              >
                {importing
                  ? t("integrations.crmImport.importing")
                  : t("integrations.crmImport.startImport")}
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