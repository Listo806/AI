import { useEffect } from "react";

export default function PaymentSuccess() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");

    if (userId) {
      localStorage.setItem("trialUserId", userId);

      // REDIRECT TO ONBOARDING
      window.location.href = "/onboarding";
    } else {
      window.location.href = "/trial";
    }
  }, []);

  return <div>Activating your account...</div>;
}