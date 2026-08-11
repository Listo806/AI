import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const STORAGE_PREFIX = "listo_";

// Landing page for the Free-plan recovery email CTA. The ?token in the URL is a
// secure single-use activation token validated server-side. The backend activates
// Free Forever on the existing account only if it still has no plan (it never
// overwrites a paid plan), then returns a normal session so we drop the user
// straight into the dashboard. An invalid/expired token routes safely to sign-in.
export default function ActivateFree() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get("token");
    if (!token) {
      navigate("/sign-in", { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await apiClient.request("/trial/recover-free", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (res?.accessToken) {
          apiClient.setTokens(res.accessToken, res.refreshToken || null);
        }
        if (res?.user) {
          setUser(res.user);
          localStorage.setItem(
            STORAGE_PREFIX + "user",
            JSON.stringify(res.user),
          );
        }
        navigate(res?.redirect || "/dashboard", { replace: true });
      } catch (e) {
        setError(
          e?.message || "This activation link is invalid or has expired.",
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#f1f5f9",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 28,
          textAlign: "center",
        }}
      >
        {error ? (
          <>
            <h1 style={{ fontSize: 20, margin: "0 0 10px", color: "#0f172a" }}>
              Activation link problem
            </h1>
            <p style={{ color: "#475569", margin: "0 0 20px" }}>{error}</p>
            <button
              onClick={() => navigate("/sign-in", { replace: true })}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: 0,
                padding: "12px 20px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go to sign in
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, margin: "0 0 10px", color: "#0f172a" }}>
              Activating your Free plan…
            </h1>
            <p style={{ color: "#475569", margin: 0 }}>
              One moment while we set up your account.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
