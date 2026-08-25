import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Email preview that always fits the available width — NO horizontal scrollbar.
// The email renders at a fixed 620px width inside an iframe, then the whole iframe
// is scaled down (never up) to the container width, so the full width is always
// visible. Only vertical scrolling remains, capped at `maxHeight`. Works for the
// fixed-width lifecycle templates AND for custom emails with uploaded images.
const CONTENT_W = 620;

export default function EmailPreview({ html, maxHeight = 460 }) {
  const boxRef = useRef(null);
  const frameRef = useRef(null);
  const [boxW, setBoxW] = useState(CONTENT_W);
  const [contentH, setContentH] = useState(320);

  // Track the available width (responsive: modal resize, mobile, etc.).
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBoxW(el.clientWidth || CONTENT_W);
    measure();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, []);

  // Measure the rendered email height (re-measure a couple of times to catch
  // late-loading images). sandbox="allow-same-origin" (no scripts) lets us read it.
  const measureHeight = () => {
    const fr = frameRef.current;
    try {
      const doc = fr?.contentDocument;
      const h = doc?.body?.scrollHeight || doc?.documentElement?.scrollHeight;
      if (h && h > 0) setContentH(h);
    } catch {
      /* cross-origin/unreadable — keep last height */
    }
  };

  useEffect(() => {
    const t1 = setTimeout(measureHeight, 250);
    const t2 = setTimeout(measureHeight, 900);
    const t3 = setTimeout(measureHeight, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [html]);

  const scale = Math.min(1, boxW / CONTENT_W);
  const scaledH = Math.round(contentH * scale);

  return (
    <div
      ref={boxRef}
      style={{
        maxHeight,
        overflowY: "auto",
        overflowX: "hidden",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#fff",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: scaledH, overflow: "hidden" }}>
        <iframe
          ref={frameRef}
          title="Email preview"
          srcDoc={html || ""}
          onLoad={measureHeight}
          scrolling="no"
          sandbox="allow-same-origin"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: CONTENT_W,
            height: contentH,
            border: 0,
            background: "#fff",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
