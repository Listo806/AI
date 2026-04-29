import React, { useEffect, useState } from "react";
import "./Common.css";

const API_BASE = "https://ai-2-7ikc.onrender.com";

export default function CheckoutPage() {
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [acceptedBilling, setAcceptedBilling] = useState(false);

  const user = {
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
    userId: localStorage.getItem("trialUserId") || "",
  };

  // PROTECT ROUTE
  useEffect(() => {
    if (!user.email || !user.userId) {
      window.location.href = "/start-trial";
      return;
    }

    const timer = setTimeout(() => {
      setLoadingScreen(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleCheckout = async () => {
    if (!acceptedBilling) {
      alert("Please confirm billing terms.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/payment/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.userId,
          email: user.email,
          name: user.name,
        }),
      });

      const data = await res.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Checkout failed.");
        setLoading(false);
      }

    } catch (err) {
      console.error(err);
      alert("Server error.");
      setLoading(false);
    }
  };

  if (loadingScreen) {
    return <div className="h-screen flex items-center justify-center">Preparing checkout...</div>;
  }

  return (
    <div className="checkout-page container">
      <div className="box">
        <h1>Activate Your Cortexa Account</h1>

        <p>{user.email}</p>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={acceptedBilling}
            onChange={(e) => setAcceptedBilling(e.target.checked)}
          />
          I accept billing terms
        </label>

        <button onClick={handleCheckout} disabled={loading}>
          {loading ? "Redirecting..." : "Continue to Checkout"}
        </button>
      </div>
    </div>
  );
}