// Landing-page navigation; chart preview is now a static reference image.
const menu = document.getElementById('menu');
const nav = document.querySelector('header nav');
if (menu && nav) {
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }));
}
// The old product-tour controls no longer exist after the image replacement.
document.querySelectorAll('[data-open]').forEach(link => {
  link.addEventListener('click', () => {
    const target = document.getElementById('explore');
    if (target) target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  });
});
