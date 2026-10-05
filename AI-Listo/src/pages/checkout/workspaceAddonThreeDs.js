// 3D Secure step for a paid Workspace add-on charge (used only by
// WorkspaceGate). Same behaviour as the plan checkout's runThreeDs in
// CheckoutPage.jsx, kept as its own copy so the plan checkout is untouched.
//
// Nuvei returns HTML, not URLs: `challenge_request` is the bank's own page and
// takes over the window (the bank then posts to our server, which sends the
// browser back to the Workspace page with ?threeds=return&addon=<id>, where the
// gate polls); `hidden_iframe` (device fingerprint) is rendered invisibly for
// ~5s and then the authentication continues server-side.
//
// Resolves with { navigated: true } when the bank's page took over, otherwise
// with the add-on's next result from `continueFn(addonId)`.
export async function runAddonThreeDs(result, continueFn, depth = 0) {
  const ch = result?.challenge || {};
  const req = String(ch.challenge_request || "").trim();
  if (/^https?:\/\//i.test(req)) {
    window.location.href = req;
    return { navigated: true };
  }
  if (req) {
    try {
      document.open();
      document.write(req);
      document.close();
      return { navigated: true };
    } catch (e) {
      /* fall through to the server-side continue */
    }
  }
  if (ch.hidden_iframe) {
    try {
      const frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden;";
      document.body.appendChild(frame);
      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(ch.hidden_iframe);
        doc.close();
      }
    } catch (e) {
      /* ignore: the server-side continue still runs */
    }
    await new Promise((r) => setTimeout(r, 5500));
  }
  const next = await continueFn(result.addonId);
  if (
    depth < 2 &&
    next?.requires3ds &&
    (next?.challenge?.challenge_request || next?.challenge?.hidden_iframe)
  ) {
    return runAddonThreeDs({ ...next, addonId: next.addonId || result.addonId }, continueFn, depth + 1);
  }
  return next;
}
