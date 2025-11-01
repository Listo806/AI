import React, { useEffect } from "react";

export default function Checkout() {
  useEffect(() => {
    // Load PayPal SDK (client-id=sb is sandbox mode)
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=sb&currency=USD";
    script.async = true;
    script.onload = () => {
      if (window.paypal) {
        window.paypal
          .Buttons({
            createOrder: (data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: { value: "49.99" }, // default plan for demo
                    description: "Listo Qasa Owner Plan Checkout",
                  },
                ],
              });
            },
            onApprove: (data, actions) => {
              return actions.order.capture().then(() => {
                window.location.href = "/thank-you";
              });
            },
          })
          .render("#paypal-button-container");
      }
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white text-gray-800">
      <header className="w-full text-center py-6 border-b border-gray-100 bg-white/70 backdrop-blur-md">
        <h1 className="text-3xl font-light italic text-gray-900">
          Secure Checkout — <span className="text-blue-600">Listo Qasa</span>
        </h1>
      </header>

      <main className="max-w-md mx-auto bg-white border border-gray-200 shadow-lg rounded-2xl p-8 mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">
          Owner Plan Payment
        </h2>
        <p className="text-gray-600 mb-6">
          Complete your subscription below to activate your listing features.
        </p>

        <div id="paypal-button-container" className="mt-4"></div>

        <p className="text-xs text-gray-400 mt-6">
          Payments are securely processed through PayPal.
        </p>
      </main>

      <footer className="py-10 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Listo Qasa — All rights reserved.
      </footer>
    </div>
  );
}
