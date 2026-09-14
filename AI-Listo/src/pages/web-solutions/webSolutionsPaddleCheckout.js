import {
  initPaddle,
  paddleInlineSettings,
  PADDLE_INLINE_FRAME_CLASS,
} from "../checkout/paddleCheckout";

export { PADDLE_INLINE_FRAME_CLASS };

export function webSolutionPaddleReady(config) {
  return Boolean(config?.clientToken);
}

export async function initWebSolutionPaddle(config, onEvent) {
  return initPaddle(config, onEvent);
}

export function openWebSolutionPaddleCheckout({
  transactionId,
  inline = true,
}) {
  if (!window.Paddle?.Checkout?.open) {
    throw new Error("Paddle Checkout is not initialized");
  }

  if (!transactionId) {
    throw new Error("Missing Paddle transaction id");
  }

  window.Paddle.Checkout.open({
    ...(inline ? { settings: paddleInlineSettings() } : {}),
    transactionId,
  });
}
