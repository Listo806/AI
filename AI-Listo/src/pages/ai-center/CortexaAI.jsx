import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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

  const handleActionClick = (actionPrompt) => {
    setPrompt(actionPrompt);
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    console.log("Send prompt:", prompt);
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
          <button className="active ask">
            <Sparkles />
            {t("cortexa.ask")}
          </button>

          <button>
            {t("cortexa.workflows")}
          </button>
        </div>

        <div className="ai-box">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("cortexa.ai_placeholder")}
          />

          <div className="ai-actions-bar">
            <div className="left">
              <button className="circle-btn">
                <Plus size={18} />
              </button>

              <button className="pill-btn">
                <Sparkles size={16} />
                CORTEXA AI
              </button>
            </div>

            <div className="right">
              <button className="circle-btn">
                <Mic size={18} />
              </button>

              <button className="send-btn" onClick={handleSubmit}>
                <Send size={16} />
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