import { useEffect } from "react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hasSession =
      apiClient.accessToken || localStorage.getItem("listo_access_token");

    const run = async () => {
      if (hasSession) {
        try {
          await refreshUser();
        } catch (e) {
          // ignore; webhook + next load will reconcile status
        }
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/sign-in", { replace: true });
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>Activating your account...</div>;
}
