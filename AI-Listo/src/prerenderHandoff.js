// Hands the page over from the written copy to the running application.
//
// Public pages arrive with their content already in the HTML (#prerender,
// written at build time by scripts/prerender.mjs) so crawlers and slow
// connections see the page immediately. The application renders into #root,
// which stays hidden behind that copy until it shows the same page. Then the
// copy is removed and #root is revealed in the same frame, so the visitor never
// sees a gap, a spinner or a jump.

const MAX_WAIT_MS = 8000;

function reveal() {
  const copy = document.getElementById("prerender");
  if (copy) copy.remove();
  const style = document.getElementById("prerender-style");
  if (style) style.remove();
  document.documentElement.classList.remove("has-prerender");
}

export function handOffPrerender() {
  if (typeof document === "undefined" || !document.getElementById("prerender")) return;
  const root = document.getElementById("root");
  const started = performance.now();

  const ready = () =>
    root &&
    !root.querySelector(".app-splash") &&
    (root.querySelector("h1") || root.children.length > 0);

  const tick = () => {
    if (performance.now() - started > MAX_WAIT_MS) return reveal();
    if (ready()) {
      // Two frames: React has committed and the browser has laid it out.
      requestAnimationFrame(() => requestAnimationFrame(reveal));
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
