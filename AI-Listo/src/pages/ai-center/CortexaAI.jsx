import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import {
  Sparkles,
  Mic,
  Send,
  Plus,
  MessageCircle,
  UserCheck,
  Repeat,
  Home,
  Megaphone,
  BarChart3,
  Search,
  CalendarCheck,
  PenLine,
} from "lucide-react";

import "./CortexaAI.css";
import centerlogoImg from "../../assets/cortexa/cortexaAI.png";

export default function CortexaAI() {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("ask");
  const { user } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  React.useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      return;
    }

    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionInstance.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setPrompt(transcript);
    };

    setRecognition(recognitionInstance);
  }, []);

  const handleMicClick = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const sendToCortexaAI = async (payload = {}) => {
    try {
      if (!payload.message && (!payload.attachments || !payload.attachments.length)) {
        return;
      }
      
      const workspaceId = user?.teamId || user?.workspaceId || null;
      const res = await apiClient.request("/ai-center/agent", {
        method: "POST",
        body: JSON.stringify({
          message: payload.message,
          attachments: payload.attachments || [],
          conversationId,
          workspaceId,
        }),
      });
      setConversationId(res.conversationId);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: payload.message,
          attachments: payload.attachments || [],
        },
        {
          role: "assistant",
          content: res.answer,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err?.response?.data?.message || "AI request failed",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    try {
      setUploading(true);

      /*
      * LOCAL TEMP FILES
      */
      const tempFiles = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploading: true,
      }));

      setAttachedFiles((prev) => [...prev, ...tempFiles]);

      /*
      * FORM DATA
      */
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      /*
      * API CALL
      */
      const res = await apiClient.request("/ai-center/upload", {
        method: "POST",
        body: formData,
      });

      console.log("UPLOAD RESPONSE:", res);

      /*
      * REPLACE TEMP FILES
      */
      setAttachedFiles((prev) => {
        const filtered = prev.filter(
          (f) => !tempFiles.find((t) => t.id === f.id)
        );

        const uploadedFiles = (res.files || []).map((file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url,
          key: file.key,
          uploading: false,
        }));

        return [...filtered, ...uploadedFiles];
      });
    } catch (err) {
      console.error("UPLOAD FAILED:", err);

      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (id) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };
  const aiActions = [
    {
      title: t("cortexa.auto_reply"),
      subtitle: t("cortexa.auto_reply_subtitle"),
      icon: MessageCircle,
      prompt: t("cortexa.auto_reply_prompt"),
    },
    {
      title: t("cortexa.qualify_leads"),
      subtitle: t("cortexa.qualify_leads_subtitle"),
      icon: UserCheck,
      prompt: t("cortexa.qualify_leads_prompt"),
    },
    {
      title: t("cortexa.create_follow_up"),
      subtitle: t("cortexa.create_follow_up_subtitle"),
      icon: Repeat,
      prompt: t("cortexa.create_follow_up_prompt"),
    },
    {
      title: t("cortexa.write_property_listing"),
      subtitle: t("cortexa.write_property_listing_subtitle"),
      icon: Home,
      prompt: t("cortexa.write_property_listing_prompt"),
    },
    {
      title: t("cortexa.generate_ad_copy"),
      subtitle: t("cortexa.generate_ad_copy_subtitle"),
      icon: Megaphone,
      prompt: t("cortexa.generate_ad_copy_prompt"),
    },
    {
      title: t("cortexa.analyze_pipeline"),
      subtitle: t("cortexa.analyze_pipeline_subtitle"),
      icon: BarChart3,
      prompt: t("cortexa.analyze_pipeline_prompt"),
    },
    {
      title: t("cortexa.find_cold_leads"),
      subtitle: t("cortexa.find_cold_leads_subtitle"),
      icon: Search,
      prompt: t("cortexa.find_cold_leads_prompt"),
    },
    {
      title: t("cortexa.book_appointment"),
      subtitle: t("cortexa.book_appointment_subtitle"),
      icon: CalendarCheck,
      prompt: t("cortexa.book_appointment_prompt"),
    },
    {
      title: t("cortexa.write_whatsapp_message"),
      subtitle: t("cortexa.write_whatsapp_message_subtitle"),
      icon: PenLine,
      prompt: t("cortexa.write_whatsapp_message_prompt"),
    },
    {
      title: t("cortexa.summarize_leads"),
      subtitle: t("cortexa.summarize_leads_subtitle"),
      icon: Sparkles,
      prompt: t("cortexa.summarize_leads_prompt"),
    },
  ];

  const handleActionClick = async (actionPrompt) => {
    setPrompt(actionPrompt);

    await sendToCortexaAI({
      message: actionPrompt,
      attachments: [],
    });
  };

  const handleSubmit = async () => {
    if (!prompt.trim() && attachedFiles.length === 0) {
      return;
    }

    try {
      await sendToCortexaAI({
        message: prompt,
        attachments: attachedFiles,
      });

      setPrompt("");
      setAttachedFiles([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-container">
        <div className="ai-bg-blur" />

        <div className="ai-header">
          <h1>
            <img src={centerlogoImg} className="cx-logo-img" alt="CORTEXA AI" />
          </h1>
        </div>

        <div className="ai-tabs">
          <button
            className={mode === "ask" ? "active ask" : ""}
            onClick={() => setMode("ask")}
          >
            <Sparkles />
            {t("cortexa.ask")}
          </button>

          <button
            className={mode === "workflows" ? "active" : ""}
            onClick={() => setMode("workflows")}
          >
            {t("cortexa.workflows")}
          </button>
        </div>

        <div className="ai-box">
          <div className="ai-chat-results">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}

            {loading && (
              <div className="ai-message assistant">CORTEXA is thinking...</div>
            )}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("cortexa.ai_placeholder")}
          />
          {attachedFiles.length > 0 && (
            <div className="ai-attachments">
              {attachedFiles.map((file) => (
                <div key={file.id} className="ai-attachment-item">
                  <div className="ai-attachment-left">
                    <span className="ai-attachment-name">{file.name}</span>

                    <span className="ai-attachment-size">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    {file.uploading && (
                      <span className="ai-attachment-uploading">
                        Uploading...
                      </span>
                    )}
                  </div>

                  <button
                    className="ai-attachment-remove"
                    onClick={() => removeAttachment(file.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept="
              image/*,
              .pdf,
              .doc,
              .docx,
              .xls,
              .xlsx,
              .csv,
              .txt
            "
            onChange={handleFileSelect}
          />
          <div className="ai-actions-bar">
            <div className="left">
              <div className="upload-menu-wrapper">
                <button
                  className="circle-btn"
                  onClick={() => setShowUploadMenu((v) => !v)}
                >
                  <Plus size={18} />
                </button>

                {showUploadMenu && (
                  <div className="upload-menu">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                    >
                      Upload File
                    </button>

                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                    >
                      Upload Image
                    </button>

                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                    >
                      Attach Document
                    </button>

                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                    >
                      Import CSV / Leads
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="right">
              <button
                className={`circle-btn ${isListening ? "listening" : ""}`}
                onClick={handleMicClick}
              >
                <Mic size={18} />
              </button>

              <button
                className="send-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {uploading
                  ? "Uploading..."
                  : loading
                  ? "Thinking..."
                  : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="ai-grid">
          {aiActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                className="ai-card"
                onClick={() => handleActionClick(action.prompt)}
              >
                <div className="ai-card-icon">
                  <Icon size={16} />
                </div>

                <div>
                  <h3>{action.title}</h3>
                  <p>{action.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
