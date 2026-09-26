import apiClient from './apiClient';

// Public website contact form -> POST {API_BASE}/contact (no auth).
// Uses the same API base URL as apiClient, but a plain fetch so the page can
// tell validation (400), rate-limit (429) and provider (502) errors apart and
// no session token is attached to a public request.
export async function submitContactForm(payload) {
  let response;
  try {
    response = await fetch(`${apiClient.baseUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (_e) {
    return { ok: false, status: 0, data: null };
  }
  const data = await response.json().catch(() => null);
  return { ok: response.ok && data?.success !== false, status: response.status, data };
}
