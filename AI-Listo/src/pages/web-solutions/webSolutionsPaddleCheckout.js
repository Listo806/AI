import {
  initPaddle,
  paddleInlineSettings,
  PADDLE_INLINE_FRAME_CLASS,
} from "../checkout/paddleCheckout";

export { PADDLE_INLINE_FRAME_CLASS };

export function webSolutionPaddleReady(config, serviceId) {
  return Boolean(
    config?.clientToken &&
      serviceId &&
      config?.prices?.[serviceId],
  );
}

export async function initWebSolutionPaddle(config, onEvent) {
  return initPaddle(config, onEvent);
}

export function openWebSolutionPaddleCheckout({
  config,
  serviceId,
  customer,
  metadata = {},
  inline = true,
}) {
  if (!window.Paddle?.Checkout?.open) {
    throw new Error("Paddle Checkout is not initialized");
  }

  const priceId = config?.prices?.[serviceId];

  if (!priceId) {
    throw new Error(
      `Paddle Web Solutions price is not configured for: ${serviceId}`,
    );
  }

  const email = String(customer?.email || "").trim();
  const countryCode = String(customer?.countryCode || "").trim().toUpperCase();

  const paddleCustomer = email
    ? {
        email,
        ...(countryCode
          ? {
              address: {
                countryCode,
              },
            }
          : {}),
      }
    : undefined;

  window.Paddle.Checkout.open({
    ...(inline ? { settings: paddleInlineSettings() } : {}),

    items: [
      {
        priceId,
        quantity: 1,
      },
    ],

    customer: paddleCustomer,

    customData: {
      purchaseType: "web_solution",
      serviceId,
      fullName: customer?.fullName || "",
      businessName: customer?.businessName || "",
      phone: customer?.phone || "",
      website: customer?.website || "",
      userId: customer?.userId || null,
      ...metadata,
    },
  });
}
