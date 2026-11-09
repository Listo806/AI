// CRM root assets are separate from /charts/app/ assets.
const head = document.head;
function link(rel, href, extra = {}) {
  document.querySelectorAll(`link[rel="${rel}"]`).forEach(node => node.remove());
  const node = document.createElement('link'); node.rel = rel; node.href = href;
  Object.assign(node, extra); head.appendChild(node);
}
link('manifest', '/manifest.webmanifest');
link('icon', '/favicon.png', {type:'image/png'});
link('apple-touch-icon', '/apple-touch-icon.png', {sizes:'180x180'});
let title = document.querySelector('meta[name="apple-mobile-web-app-title"]');
if (!title) { title = document.createElement('meta'); title.name='apple-mobile-web-app-title'; head.appendChild(title); }
title.content='Cortexa';
