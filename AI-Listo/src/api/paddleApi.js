import apiClient from "./apiClient";

// Public Paddle config:
//
// {
//   clientToken,
//   environment,
//
//   prices: {
//     solo,
//     team,
//     growth
//   },
//
//   startPrices: {
//     solo,
//     team,
//     growth
//   }
// }
//
// prices:
//   solo   = $197/month
//   team   = $347/month
//   growth = $497/month
//
// startPrices:
//   solo   = $7 one-time
//   team   = $14 one-time
//   growth = $21 one-time
//
// IMPORTANT:
// Do not fall back to the old $97 payment flow if the new
// starting-price IDs have not been configured.

export async function fetchPaddleConfig() {
  try {
    return await apiClient.request("/payments/paddle/config");
  } catch {
    return null;
  }
}