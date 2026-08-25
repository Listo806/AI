import { useEffect, useMemo, useRef, useState } from "react";
import {
  Type,
  Image as ImageIcon,
  MousePointerClick,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader,
} from "lucide-react";
import { uploadEmailImage } from "../api/platformApi";
import EmailPreview from "./EmailPreview";

// Build the composed email BODY html from blocks. This is the single source of
// truth for both the preview and what gets sent (the backend wraps it in a
// responsive shell + unsubscribe footer). Images are responsive: max-width:100%,
// height:auto, so they fit desktop + mobile with no horizontal scrolling.
const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
const BTN_COLOR = "#6d5cf0";

function blockHtml(b) {
  if (b.type === "text") {
    const t = esc(b.text || "").replace(/\r?\n/g, "<br/>");
    if (!t.trim()) return "";
    return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333333;padding:6px 0;">${t}</div>`;
  }
  if (b.type === "image") {
    if (!b.url) return "";
    return `<div style="padding:8px 0;text-align:center;"><img src="${escAttr(
      b.url,
    )}" alt="${escAttr(
      b.alt || "",
    )}" style="display:block;width:100%;max-width:600px;height:auto;border:0;margin:0 auto;" /></div>`;
  }
  if (b.type === "button") {
    const txt = esc(b.text || "").trim();
    const url = String(b.url || "").trim();
    if (!txt || !url) return "";
    const href = /^(https?:)?\/\//i.test(url) ? url : `https://${url}`;
    return `<div style="padding:16px 0;text-align:center;"><a href="${escAttr(
      href,
    )}" target="_blank" style="display:inline-block;background:${BTN_COLOR};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">${txt}</a></div>`;
  }
  return "";
}

function buildBodyHtml(blocks) {
  return (blocks || []).map(blockHtml).join("");
}

function wrapPreview(body) {
  const inner =
    body ||
    `<div style="color:#9aa0ae;font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:26px 0;text-align:center;">Your email preview will appear here.</div>`;
  return `<div style="background:#f4f4f7;margin:0;padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;"><tr><td align="center" style="padding:22px 10px;"><table role="presentation" align="center" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="padding:26px 26px 14px;">${inner}</td></tr><tr><td style="padding:14px 24px 24px;border-top:1px solid #eeeef2;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.7;color:#98a0ae;text-align:center;">You are receiving this email from Cortexa.<br/><a href="#" style="color:#7c6cf6;">Unsubscribe</a></td></tr></table></td></tr></table></div>`;
}

let _bid = 0;
const newBlock = (type) => {
  _bid += 1;
  const id = `b${Date.now()}_${_bid}`;
  if (type === "text") return { id, type, text: "" };
  if (type === "image") return { id, type, url: "", alt: "", uploading: false, error: "" };
  return { id, type: "button", text: "", url: "" };
};

/**
 * Reusable email composer: write your own subject + body, add/reorder Text, Image
 * and Button blocks, upload images, and see a live preview. Reports the composed
 * { subject, html, valid } up via onChange; the parent sends subject + html.
 */
export default function EmailComposer({ onChange, compact = false }) {
  const [subject, setSubject] = useState("");
  const [blocks, setBlocks] = useState([newBlock("text")]);
  const fileInputs = useRef({});

  const bodyHtml = useMemo(() => buildBodyHtml(blocks), [blocks]);
  const hasContent = bodyHtml.trim().length > 0;
  const valid = subject.trim().length > 0 && hasContent;

  useEffect(() => {
    onChange?.({
      subject: subject.trim(),
      html: bodyHtml,
      previewHtml: wrapPreview(bodyHtml),
      valid,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, bodyHtml, valid]);

  const update = (id, patch) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id) => setBlocks((bs) => bs.filter((b) => b.id !== id));
  const add = (type) => setBlocks((bs) => [...bs, newBlock(type)]);
  const move = (id, dir) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const pickImage = async (id, file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      update(id, { error: "Please choose an image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      update(id, { error: "Image is too large (max 5 MB)." });
      return;
    }
    update(id, { uploading: true, error: "" });
    try {
      const res = await uploadEmailImage(file);
      if (res?.ok && res.url) update(id, { url: res.url, uploading: false });
      else update(id, { uploading: false, error: res?.error || "Upload failed." });
    } catch (e) {
      update(id, { uploading: false, error: e?.message || "Upload failed." });
    }
  };

  return (
    <div style={S.wrap}>
      <label style={S.label}>Subject</label>
      <input
        style={S.input}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Your email subject"
      />

      <label style={{ ...S.label, marginTop: 14 }}>Email content</label>
      <div style={S.blocks}>
        {blocks.map((b, i) => (
          <div key={b.id} style={S.block}>
            <div style={S.blockHead}>
              <span style={S.blockType}>
                {b.type === "text" ? <Type size={13} /> : b.type === "image" ? <ImageIcon size={13} /> : <MousePointerClick size={13} />}
                {b.type === "text" ? "Text" : b.type === "image" ? "Image" : "Button"}
              </span>
              <div style={S.blockCtrls}>
                <button type="button" style={S.iconBtn} title="Move up" disabled={i === 0} onClick={() => move(b.id, -1)}>
                  <ArrowUp size={14} />
                </button>
                <button type="button" style={S.iconBtn} title="Move down" disabled={i === blocks.length - 1} onClick={() => move(b.id, 1)}>
                  <ArrowDown size={14} />
                </button>
                <button type="button" style={{ ...S.iconBtn, color: "#dc2626" }} title="Remove" onClick={() => remove(b.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {b.type === "text" && (
              <textarea
                style={S.textarea}
                rows={compact ? 3 : 4}
                value={b.text}
                onChange={(e) => update(b.id, { text: e.target.value })}
                placeholder="Write your text…"
              />
            )}

            {b.type === "image" && (
              <div>
                {b.url ? (
                  <div style={S.imgWrap}>
                    <img src={b.url} alt="" style={S.imgThumb} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" style={S.smallBtn} onClick={() => fileInputs.current[b.id]?.click()}>
                        Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    style={S.upload}
                    disabled={b.uploading}
                    onClick={() => fileInputs.current[b.id]?.click()}
                  >
                    {b.uploading ? (
                      <>
                        <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> Uploading…
                      </>
                    ) : (
                      <>
                        <ImageIcon size={16} /> Upload image
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={(el) => (fileInputs.current[b.id] = el)}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    pickImage(b.id, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {b.error && <div style={S.err}>{b.error}</div>}
              </div>
            )}

            {b.type === "button" && (
              <div style={{ display: "grid", gap: 8 }}>
                <input
                  style={S.input}
                  value={b.text}
                  onChange={(e) => update(b.id, { text: e.target.value })}
                  placeholder="Button text (e.g. Claim your offer)"
                />
                <input
                  style={S.input}
                  value={b.url}
                  onChange={(e) => update(b.id, { url: e.target.value })}
                  placeholder="Button link (https://…)"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={S.addRow}>
        <button type="button" style={S.addBtn} onClick={() => add("text")}>
          <Type size={14} /> Text
        </button>
        <button type="button" style={S.addBtn} onClick={() => add("image")}>
          <ImageIcon size={14} /> Image
        </button>
        <button type="button" style={S.addBtn} onClick={() => add("button")}>
          <MousePointerClick size={14} /> Button
        </button>
      </div>

      <label style={{ ...S.label, marginTop: 14 }}>Preview</label>
      <EmailPreview html={wrapPreview(bodyHtml)} maxHeight={compact ? 340 : 420} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  wrap: { display: "flex", flexDirection: "column" },
  label: { fontSize: 12.5, fontWeight: 700, color: "#334155", margin: "0 0 6px" },
  input: {
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    padding: "10px 11px",
    fontSize: 14,
    color: "#0f1522",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  blocks: { display: "flex", flexDirection: "column", gap: 10 },
  block: { border: "1px solid #e6e8f0", borderRadius: 10, padding: 12, background: "#fbfbfe" },
  blockHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  blockType: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#64748b" },
  blockCtrls: { display: "flex", gap: 4 },
  iconBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 7,
    padding: 5,
    cursor: "pointer",
    color: "#475569",
    lineHeight: 0,
  },
  textarea: {
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    padding: "10px 11px",
    fontSize: 14,
    color: "#0f1522",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
  },
  upload: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px dashed #c7cede",
    background: "#fff",
    borderRadius: 9,
    padding: "12px 16px",
    cursor: "pointer",
    color: "#475569",
    fontSize: 13.5,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  imgWrap: { display: "flex", alignItems: "center", gap: 12 },
  imgThumb: { maxWidth: 120, maxHeight: 80, borderRadius: 8, border: "1px solid #e2e8f0", display: "block" },
  smallBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 8,
    padding: "7px 12px",
    cursor: "pointer",
    fontSize: 13,
    color: "#475569",
    fontFamily: "inherit",
  },
  addRow: { display: "flex", gap: 8, marginTop: 10 },
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #d9def0",
    background: "#f2f0ff",
    color: "#4a37d4",
    borderRadius: 9,
    padding: "9px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  err: { color: "#dc2626", fontSize: 12, marginTop: 6 },
};
