import React, { useState } from "react";
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

const aiActions = [
  {
    title: "Auto Reply",
    subtitle: "Create instant lead replies",
    icon: MessageCircle,
    prompt: "Create an automated WhatsApp reply flow for new buyer leads.",
  },
  {
    title: "Qualify Leads",
    subtitle: "Score and classify leads",
    icon: UserCheck,
    prompt: "Analyze and qualify my newest leads as hot, warm, or cold.",
  },
  {
    title: "Create Follow-Up",
    subtitle: "Build a nurture sequence",
    icon: Repeat,
    prompt: "Create a follow-up sequence for leads that have not responded.",
  },
  {
    title: "Write Property Listing",
    subtitle: "Generate listing copy",
    icon: Home,
    prompt: "Write a premium real estate property description for this listing.",
  },
  {
    title: "Generate Ad Copy",
    subtitle: "Create marketing campaigns",
    icon: Megaphone,
    prompt: "Create high-converting real estate ad copy for Facebook and Google.",
  },
  {
    title: "Analyze Pipeline",
    subtitle: "Find deal opportunities",
    icon: BarChart3,
    prompt: "Analyze my pipeline and tell me which deals need attention today.",
  },
  {
    title: "Find Cold Leads",
    subtitle: "Recover lost opportunities",
    icon: Search,
    prompt: "Find cold leads that stopped responding and suggest recovery messages.",
  },
  {
    title: "Book Appointment",
    subtitle: "Create appointment messages",
    icon: CalendarCheck,
    prompt: "Write a message to book an appointment with a qualified buyer lead.",
  },
  {
    title: "Write WhatsApp Message",
    subtitle: "Send better replies",
    icon: PenLine,
    prompt: "Write a professional WhatsApp follow-up message for a real estate lead.",
  },
  {
    title: "Summarize Leads",
    subtitle: "Get a summary of new leads",
    icon: Sparkles,
    prompt: "Give me a detailed summary of my new leads from the last 24 hours.",
  },
];

export default function CortexaAI() {
  const [prompt, setPrompt] = useState("");

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
        
          <h1><img src={centerlogoImg} className="cx-logo-img" /></h1>

        </div>
        <div className="ai-tabs">
            <button className="active ask"><Sparkles/>Ask</button>
            <button>Workflows</button>
          </div>
        <div className="ai-box">
          

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like CORTEXA AI to do today?"
          />

          <div className="ai-actions-bar">
            <div className="left">
              <button className="circle-btn"><Plus size={18} /></button>
              <button className="pill-btn">
                <Sparkles size={16} /> CORTEXA AI
              </button>
            </div>

            <div className="right">
              <button className="circle-btn"><Mic size={18} /></button>
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