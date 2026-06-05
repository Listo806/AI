import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  User,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import "./Common.css";
import trial from "../../assets/cortexa/trial-right.png";
import trialogo from "../../assets/cortexa/trial-logo.png";

export default function StartTrial() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "owner",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        "https://backend.cortexaaicrm.com/api/trial/start-trial",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("trialUserId", data.userId);
        localStorage.setItem("email", form.email);
        localStorage.setItem("name", form.name);
        localStorage.setItem("password", form.password);
        navigate("/checkout");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("SUBMIT ERROR:", error.message);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trial-page">
      <div className="trial-container">
        <div className="trial-left-column">
          <div className="trial-header">
            <div className="trial-logo-area">
              <div className="trial-logo-box">
                <span className="trial-logo-inner-c">
                  <img src={trialogo} alt="CORTEXA" />
                </span>
              </div>
              <span className="trial-logo-text">CORTEXA</span>
              <span className="trial-logo-divider">|</span>
              <span className="trial-logo-badge">AI CRM</span>
            </div>
          </div>

          <h1 className="trial-title">Start Getting AI-Powered Leads — 24/7</h1>

          <p className="trial-desc">
            CORTEXA is an AI-powered CRM built for real estate agents and teams.
            Capture, qualify, and close leads automatically — without manual
            follow-up.
          </p>

          <ul className="trial-features">
            <li>
              <span className="trial-check-icon">
                <Check size={13} strokeWidth={3} />
              </span>
              Capture and qualify leads automatically — no missed opportunities
            </li>
            <li>
              <span className="trial-check-icon">
                <Check size={13} strokeWidth={3} />
              </span>
              AI follows up instantly via text, WhatsApp, and more
            </li>
            <li>
              <span className="trial-check-icon">
                <Check size={13} strokeWidth={3} />
              </span>
              Smart pipelines track every deal in real time
            </li>
            <li>
              <span className="trial-check-icon">
                <Check size={13} strokeWidth={3} />
              </span>
              Access your full dashboard immediately after activation
            </li>
          </ul>

          <div className="trial-card">
            <form onSubmit={handleSubmit}>
              <div className="trial-input-group">
                <span className="trial-input-icon">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  required
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="trial-input-group">
                <span className="trial-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="Work Email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="trial-input-group">
                <span className="trial-input-icon">
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number (Required)"
                  required
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="trial-input-group">
                <span className="trial-input-icon">
                  <LockKeyhole size={18} />
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  minLength="6"
                  value={form.password}
                  onChange={handleChange}
                />
                <span className="trial-password-toggle">
                  <Eye size={18} />
                </span>
              </div>

              <button
                type="submit"
                className="trial-submit-btn"
                disabled={loading}
              >
                <span className="trial-btn-lock">
                  <LockKeyhole size={16} />
                </span>
                {loading
                  ? "Creating Account..."
                  : "Continue to Secure Checkout"}
                <span className="trial-btn-arrow">
                  <ChevronRight size={18} />
                </span>
              </button>

              <div className="trial-footer-text">
                <span className="trial-shield-icon">
                  <ShieldAlert size={20} />
                </span>
                <p>
                  You will be redirected to secure checkout to activate your
                  account with a one-time setup fee.
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="trial-right-column">
          <img src={trial} alt="Trial" />
        </div>
      </div>
    </div>
  );
}
