export function registerListoQasaPwa() {
  document.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove());
  const favicon = document.createElement('link');
  favicon.rel = 'icon'; favicon.type = 'image/png'; favicon.href = '/favicon.png';
  document.head.appendChild(favicon);
  const touch = document.createElement('link');
  touch.rel = 'apple-touch-icon'; touch.sizes = '180x180'; touch.href = '/apple-touch-icon.png';
  document.head.appendChild(touch);
  document.querySelectorAll('meta[name="apple-mobile-web-app-title"]').forEach(el => el.remove());
  const title = document.createElement('meta'); title.name = 'apple-mobile-web-app-title'; title.content = 'ListoQasa'; document.head.appendChild(title);
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = '/manifest.webmanifest';
  document.head.appendChild(manifest);
  const theme = document.createElement('meta');
  theme.name = 'theme-color';
  theme.content = '#0968f8';
  document.head.appendChild(theme);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}), { once: true });
  }
}
