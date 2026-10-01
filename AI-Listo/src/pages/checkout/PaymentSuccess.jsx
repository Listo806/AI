import { useEffect } from "react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { localePrefixFromPath, withLocalePrefix } from "../../i18n/funnelLocale";

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
        // A browser success page is never an activation authority. Route into
        // the backend-gated onboarding flow; it will require confirmed payment
        // + verified email before workspace selection can open.
        navigate(withLocalePrefix(localePrefixFromPath(window.location.pathname), "/onboarding"), { replace: true });
      } else {
        // Keep the page's language (/es/payment-success -> /es/sign-in).
        navigate(withLocalePrefix(localePrefixFromPath(window.location.pathname), "/sign-in"), { replace: true });
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>Activating your account...</div>;
}
