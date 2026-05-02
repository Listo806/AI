import { useEffect } from "react";

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
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const userId = params.get("userId");

      const autoLogin = async () => {
        if (!userId) {
          window.location.href = "/trial";
          return;
        }

        try {
          
          const res = await fetch(`https://ai-2-7ikc.onrender.com/api/auth/user/${userId}`);
          const data = await res.json();

          const user = data.user;

          const loginRes = await fetch(`https://ai-2-7ikc.onrender.com/api/auth/login-by-id`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          });

          const loginData = await loginRes.json();

          if (loginData.accessToken) {
            localStorage.setItem("listo_access_token", loginData.accessToken);
            localStorage.setItem("listo_user", JSON.stringify(loginData.user));

            window.location.href = "/dashboard";
          } else {
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