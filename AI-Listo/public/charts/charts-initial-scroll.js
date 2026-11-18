/* Cortexa Charts landing: start fresh visits at the hero, not a restored bottom position.
 * Intentional #workspace, #calendar, #intelligence, etc. navigation is preserved.
 */
(function () {
  'use strict';
  var path = window.location.pathname.replace(/\/+$/, '');
  if (path !== '/charts') return;

  // Any explicit anchor belongs to the visitor; never override it.
  if (window.location.hash) return;

  var userMoved = false;
  var bootComplete = false;
  var startedAt = Date.now();
  var correctionTimer = null;
  var stopTimer = null;
  var touchOrigin = null;

  function stop() {
    userMoved = true;
    if (correctionTimer !== null) window.clearTimeout(correctionTimer);
    if (stopTimer !== null) window.clearTimeout(stopTimer);
  }
  function isEligible() {
    return !userMoved && !window.location.hash && Date.now() - startedAt < 1500;
  }
  function resetToTop() {
    if (!isEligible()) return;
    // instant avoids a visible animated scroll back up.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }
  function onPointerDown(event) {
    // A user can tap a section link, open a dropdown or begin dragging.
    if (event.isTrusted) stop();
  }
  function onKeyDown(event) {
    if (event.isTrusted && /^(ArrowDown|ArrowUp|PageDown|PageUp|Home|End| |Spacebar)$/.test(event.key)) stop();
  }
  function onWheel(event) { if (event.isTrusted) stop(); }
  function onTouchStart(event) { if (event.isTrusted) stop(); }
  function onHashChange() { stop(); }

  document.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
  document.addEventListener('wheel', onWheel, { passive: true, capture: true });
  document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  document.addEventListener('keydown', onKeyDown, { capture: true });
  window.addEventListener('hashchange', onHashChange);

  // Correct a restored scroll position as soon as possible and after layout settles.
  resetToTop();
  window.requestAnimationFrame(function () {
    resetToTop();
    window.requestAnimationFrame(resetToTop);
  });
  document.addEventListener('DOMContentLoaded', resetToTop, { once: true });
  window.addEventListener('load', resetToTop, { once: true });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && !window.location.hash && !userMoved) resetToTop();
  });
  correctionTimer = window.setTimeout(resetToTop, 350);
  stopTimer = window.setTimeout(function () {
    bootComplete = true;
    // Do not keep forcing the scroll position after initial page load.
    stop();
  }, 1400);
})();
