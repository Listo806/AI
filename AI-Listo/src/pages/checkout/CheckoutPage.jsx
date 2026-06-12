import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import headlogoM from "../../assets/cortexa/headlogotran.png";
const API_BASE = "https://backend.cortexaaicrm.com";

const t = {
  en: {
    loadingText: "Almost there...",
    redirectText: "Redirecting you to secure checkout.",
    preparing: "Preparing checkout...",
    billingAlert: "Please confirm billing terms.",
    checkboxText: "I accept billing terms",
    buttonText: "Continue to Checkout",
    buttonLoadingText: "Processing...",
    failed: "Checkout failed.",
    serverError: "Server error.",
  },
  es: {
    loadingText: "Ya casi allí...",
    redirectText: "Redirigiéndote al pago seguro.",
    preparing: "Preparando el pago...",
    billingAlert: "Por favor, confirme los términos de facturación.",
    checkboxText: "Acepto los términos de facturación",
    buttonText: "Continuar con el pago",
    buttonLoadingText: "Procesando...",
    failed: "Pago fallido.",
    serverError: "Error del servidor.",
  },
  pt: {
    loadingText: "Você está quase lá...",
    redirectText: "Redirecionando você para o pagamento seguro.",
    preparing: "Preparando o pagamento...",
    billingAlert: "Por favor, confirme os termos de cobrança.",
    checkboxText: "Eu aceito os termos de cobrança",
    buttonText: "Continuar para o Checkout",
    buttonLoadingText: "Processando...",
    failed: "Pagamento falhou.",
    serverError: "Erro do servidor.",
  },
};

export default function CheckoutPage() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("cortexa_lang", newLang);
    setLangOpen(false);
  };
  const tr = t[lang] || t.en;

  const [loadingScreen, setLoadingScreen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [acceptedBilling, setAcceptedBilling] = useState(false); // Lưu trạng thái checkbox

  const user = {
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
    userId: localStorage.getItem("trialUserId") || "",
  };
  const navigate = useNavigate();

  // PROTECT ROUTE
  useEffect(() => {
    if (!user.userId) {
      navigate("/trial");
      return;
    }

    const timer = setTimeout(() => {
      setLoadingScreen(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user.userId, navigate]);

  // HÀM XỬ LÝ KHI NGƯỜI DÙNG CHỦ ĐỘNG BẤM NÚT
  const handleCheckout = async () => {
    // Kiểm tra xem người dùng đã tích chọn checkbox chưa
    if (!acceptedBilling) {
      alert(tr.billingAlert);
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
        alert(tr.failed);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert(tr.serverError);
      setLoading(false);
    }
  };

  if (loadingScreen) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#070913",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontFamily: "sans-serif",
        }}
      >
        {tr.preparing}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{keyframesStyle}</style>

      <div style={styles.header}>
        <a href="/">
          <img src={headlogoM} alt="Cortexa" className="cx-logo-img" />
        </a>

        <div className="m-lang-wrapper">
          <button
            type="button"
            className="m-lang-btn"
            onClick={() => setLangOpen(!langOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textTransform: "uppercase",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              viewBox="0 0 24 24"
              fill="none"
              className="img-local"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12H22M12 2C9.43223 4.69615 8 8.27674 8 12C8 15.7233 9.43223 19.3038 12 22C14.5678 19.3038 16 15.7233 16 12C16 8.27674 14.5678 4.69615 12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {langOpen && (
            <div className="m-lang-dropdown">
              <button type="button" onClick={() => handleLangChange("en")}>
                English
              </button>
              <button type="button" onClick={() => handleLangChange("es")}>
                Español
              </button>
              <button type="button" onClick={() => handleLangChange("pt")}>
                Português
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.checkmarkWrapper}>
          <div
            style={{
              ...styles.pulseCircle,
              animation: "ping-effect 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          ></div>
          <div style={styles.middleCircle}></div>
          <div style={styles.innerCircleContainer}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="#a085ff"
              style={{ width: "32px", height: "32px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
        </div>

        <h1 style={styles.title}>{tr.loadingText}</h1>
        <p style={styles.description}>{tr.redirectText}</p>

        <div style={styles.progressBarBg}>
          <div
            style={{
              ...styles.progressBarFill,
              animation: "progress-slide 1.5s infinite ease-in-out",
            }}
          ></div>
        </div>

        <div style={styles.actionArea}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={acceptedBilling}
              onChange={(e) => setAcceptedBilling(e.target.checked)}
              style={styles.checkboxInput}
            />
            <span style={{ color: acceptedBilling ? "#fff" : "#9ca3af" }}>
              {tr.checkboxText}
            </span>
          </label>

          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.6 : 1,
              backgroundColor: acceptedBilling ? "#5842bf" : "#2d1964",
            }}
          >
            {loading ? tr.buttonLoadingText : tr.buttonText}
          </button>
        </div>
        {/* ----------------------------------------------------------------------- */}
      </div>

      {/* 3. Footer */}
      <div style={styles.footer}>Secure Encrypted Connection</div>

      <div style={styles.radialGlow}></div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#060814",
    color: "#ffffff",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "between",
    alignItems: "center",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    boxSizing: "border-box",
  },
  header: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "32px",
    paddingLeft: "8px",
    paddingRight: "8px",
    zIndex: 10,
    boxSizing: "border-box",
  },
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  rhombusLogo: {
    width: "26px",
    height: "26px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #5842bf",
    transform: "rotate(45deg)",
    borderRadius: "3px",
    boxShadow: "0 0 15px rgba(88, 66, 191, 0.5)",
  },
  innerCircle: {
    width: "8px",
    height: "8px",
    backgroundColor: "#ffffff",
    borderRadius: "50%",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "0.2em",
    color: "#f3f4f6",
  },
  langButton: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    paddingLeft: "16px",
    paddingRight: "16px",
    boxSizing: "border-box",
  },
  checkmarkWrapper: {
    position: "relative",
    width: "112px",
    height: "112px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "32px",
  },
  pulseCircle: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#351e73",
    opacity: 0.2,
    borderRadius: "50%",
  },
  middleCircle: {
    position: "absolute",
    inset: "8px",
    backgroundColor: "#2d1964",
    opacity: 0.4,
    borderRadius: "50%",
    border: "1px solid #4d32a4",
  },
  innerCircleContainer: {
    position: "absolute",
    inset: "16px",
    backgroundColor: "#1b1042",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 15px rgba(0,0,0,0.6)",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    marginBottom: "12px",
    letterSpacing: "0.02em",
    color: "#f3f4f6",
    margin: "0 0 12px 0",
  },
  description: {
    fontSize: "16px",
    color: "#9ca3af",
    fontWeight: "300",
    maxWidth: "280px",
    lineHeight: "1.6",
    margin: 0,
  },
  progressBarBg: {
    width: "128px",
    height: "3px",
    backgroundColor: "#1f2937",
    borderRadius: "9999px",
    marginTop: "32px",
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    background: "linear-gradient(to right, #6343f2, #a085ff)",
    width: "50%",
    borderRadius: "9999px",
  },

  actionArea: {
    marginTop: "40px",
    width: "100%",
    maxWidth: "300px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    alignItems: "center",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    cursor: "pointer",
    userSelect: "none",
  },
  checkboxInput: {
    width: "18px",
    height: "18px",
    accentColor: "#6343f2",
    cursor: "pointer",
  },
  submitButton: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: "12px",
    border: "none",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
  },

  footer: {
    width: "100%",
    maxWidth: "400px",
    paddingBottom: "16px",
    textAlign: "center",
    fontSize: "10px",
    color: "#4b5563",
    letterSpacing: "0.1em",
    uppercase: "true",
    zIndex: 10,
  },
  radialGlow: {
    position: "absolute",
    width: "350px",
    height: "350px",
    backgroundColor: "#221652",
    opacity: 0.15,
    borderRadius: "50%",
    filter: "blur(90px)",
    top: "35%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
};

const keyframesStyle = `
  @keyframes progress-slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes ping-effect {
    0% { transform: scale(1); opacity: 0.3; }
    70% { transform: scale(1.15); opacity: 0.1; }
    100% { transform: scale(1.2); opacity: 0; }
  }
`;
