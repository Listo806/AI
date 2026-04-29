import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Common.css";

export default function StartTrial() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
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

        try {
            const res = await fetch("https://ai-2-7ikc.onrender.com/api/auth/start-trial", {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
            });

            const data = await res.json();
            console.log("RESPONSE:", data);
            if (data.success) {
                // SAVE userId for next step (checkout)
                localStorage.setItem("trialUserId", data.userId);
                localStorage.setItem("email", form.email);
                localStorage.setItem("name", form.name);
                localStorage.setItem("password", form.password);
                // REDIRECT TO CHECKOUT
                navigate("/checkout");
            } else {
                console.log("API ERROR:", data);
                alert(data.message);
            }

        } catch (error) {
            console.error("SUBMIT ERROR:", error.message);
            alert("Server error");
        }
    };

  return (
    <div className="trial-page">
      <div className="trial-container">

        {/* LEFT */}
        <div className="trial-left">
          <p className="trial-badge">CORTEXA AI CRM</p>

          <h1>Start Getting AI-Powered Leads — 24/7</h1>

          <p className="trial-desc">
            CORTEXA is an AI-powered CRM built for real estate agents and teams.
            Capture, qualify, and close leads automatically — without manual follow-up.
          </p>

          <div className="trial-features">
            <div>✔ Capture and qualify leads automatically — no missed opportunities</div>
            <div>✔ AI follows up instantly via text, WhatsApp, and more</div>
            <div>✔ Smart pipelines track every deal in real time</div>
            <div>✔ Access your full dashboard immediately after activation</div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="trial-card">
          <form onSubmit={handleSubmit}>

            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              value={form.name}
              onChange={handleChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              required
              value={form.email}
              onChange={handleChange}
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (Required)"
              required   
              value={form.phone}
              onChange={handleChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required   
              minlength="6"
              value={form.password}
              onChange={handleChange}
            />

            <p className="small-text">Activate your AI system and start capturing leads today</p>
            
            <button type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Continue to Secure Checkout"}
            </button>
            
            <p className="small-text">You will be redirected to secure checkout to activate your account with a one-time setup fee.</p>
            
          </form>
        </div>

      </div>
    </div>
  );
}