// ListoQasa Google Ads integration. Do not send PII as event parameters.
export const GOOGLE_ADS_ID = 'AW-17836518151';
const labels = {
  registration: import.meta.env.VITE_GOOGLE_ADS_REGISTRATION_LABEL,
  contact: import.meta.env.VITE_GOOGLE_ADS_CONTACT_LABEL,
  propertyLead: import.meta.env.VITE_GOOGLE_ADS_PROPERTY_LEAD_LABEL,
};
const sent = new Set();

export function initializeGoogleAds() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
  }
  // Existing consent management must explicitly grant advertising consent.
  window.gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', wait_for_update: 500,
  });
  if (!window.__listoqasaAdsInitialized) {
    window.__listoqasaAdsInitialized = true;
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_ADS_ID);
  }
  // Reuse an existing gtag/GTM loader rather than loading the script twice.
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]') &&
      !document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
    document.head.insertBefore(script, document.head.firstChild);
  }
}

// Call this from the existing cookie consent manager when the visitor updates preferences.
export function updateGoogleAdsConsent(allowed) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    ad_storage: allowed ? 'granted' : 'denied',
    ad_user_data: allowed ? 'granted' : 'denied',
    ad_personalization: allowed ? 'granted' : 'denied',
  });
}

export function trackGoogleAdsSuccess(kind, eventId) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  const label = labels[kind];
  if (!label || !/^[A-Za-z0-9_-]+$/.test(label)) return false;
  const key = `${kind}:${eventId}`;
  if (!eventId || sent.has(key)) return false;
  const storageKey = `lq_ads_event:${key}`;
  try { if (sessionStorage.getItem(storageKey)) return false; } catch { /* restricted storage */ }
  sent.add(key);
  try { sessionStorage.setItem(storageKey, '1'); } catch { /* restricted storage */ }
  window.gtag('event', 'conversion', { send_to: `${GOOGLE_ADS_ID}/${label}` });
  return true;
}
