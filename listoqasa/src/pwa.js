export function registerListoQasaPwa() {
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
