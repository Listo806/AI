import { useEffect } from "react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


export default function PaymentSuccess() {
  // useEffect(() => {
    // const params = new URLSearchParams(window.location.search);
    // const userId = params.get("userId");

    // if (userId) {
      // localStorage.setItem("trialUserId", userId);

      // // REDIRECT TO ONBOARDING
      // window.location.href = "/dashboard";
    // } else {
      // window.location.href = "/trial";
    // }
  // }, []);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const userId = params.get("userId");
        
      const autoLogin = async () => {
        if (!userId) { console.log("if user:", userId);
          window.location.href = "/trial";
          return;
        }

        try {
            // 🔥 STEP 1: update DB
          await fetch(`https://ai-2-7ikc.onrender.com/api/payment/payment-success`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          });

          // 🔥 STEP 2: login lại
          const loginRes = await fetch(`https://ai-2-7ikc.onrender.com/api/auth/login-by-id`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          });

          const loginData = await loginRes.json();
          console.log("LOGIN DATA:", loginData);

          if (loginData.accessToken) {
              apiClient.setTokens(loginData.accessToken, null);
            localStorage.setItem("listo_access_token", loginData.accessToken);
            localStorage.setItem("listo_user", JSON.stringify(loginData.user));
            setUser(loginData.user);

             setTimeout(() => {
                navigate("/dashboard");
              }, 0);
          } else {
              console.log("LOGIN try else:", userId);
            window.location.href = "/trial";
          }

        } catch (err) {
          console.error(err);
          window.location.href = "/trial";
        }
      };

      autoLogin();
    }, []);

  return <div>Activating your account...</div>;
}