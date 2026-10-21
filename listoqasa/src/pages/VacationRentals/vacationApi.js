const BASE = (import.meta.env.VITE_API_URL || 'https://backend.cortexaaicrm.com/api').replace(/\/+$/, '');
export async function vacationRequest(path, signal) {
  const res = await fetch(`${BASE}/vacation-rentals/${path}`, { signal, headers: {Accept:'application/json'} });
  if (!res.ok) throw new Error(`Vacation rentals API: HTTP ${res.status}`);
  return res.json();
}
