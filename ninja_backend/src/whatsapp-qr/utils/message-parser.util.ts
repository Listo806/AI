/**
 * Extract normalized fields from Baileys WAMessage for QR inbound pipeline.
 */

export type ParsedInbound = {
  messageId: string | null;
  remoteJid: string;
  contactPhoneE164: string | null;
  fromMe: boolean;
  body: string;
  messageType:
    | "text"
    | "image"
    | "audio"
    | "video"
    | "document"
    | "location"
    | "sticker";
  pushName: string | null;
};

function unwrapMessage(message: any): any {
  if (!message) return null;

  return (
    message.ephemeralMessage?.message ||
    message.viewOnceMessage?.message ||
    message.viewOnceMessageV2?.message ||
    message.documentWithCaptionMessage?.message ||
    message.editedMessage?.message ||
    message
  );
}

function extractBody(message: any): string {
  const m = unwrapMessage(message);
  if (!m) return "";

  return String(
    m.conversation ||
      m.extendedTextMessage?.text ||
      m.imageMessage?.caption ||
      m.videoMessage?.caption ||
      m.documentMessage?.caption ||
      m.buttonsResponseMessage?.selectedDisplayText ||
      m.listResponseMessage?.title ||
      m.templateButtonReplyMessage?.selectedDisplayText ||
      m.interactiveResponseMessage?.body?.text ||
      m.pollCreationMessage?.name ||
      "",
  ).trim();
}

function detectMessageType(message: any): ParsedInbound["messageType"] {
  const m = unwrapMessage(message);
  if (!m) return "text";

  if (m.conversation || m.extendedTextMessage) return "text";
  if (m.imageMessage) return "image";
  if (m.audioMessage) return "audio";
  if (m.videoMessage) return "video";
  if (m.documentMessage || m.documentWithCaptionMessage) return "document";
  if (m.locationMessage || m.liveLocationMessage) return "location";
  if (m.stickerMessage) return "sticker";

  return "text";
}

function fallbackBodyByType(type: ParsedInbound["messageType"]): string {
  if (type === "image") return "📷 Photo";
  if (type === "audio") return "🎤 Voice message";
  if (type === "video") return "🎥 Video";
  if (type === "document") return "📄 Document";
  if (type === "location") return "📍 Location";
  if (type === "sticker") return "Sticker";
  return "";
}

/**
 * Parse a single WAMessage. Returns null if not a 1:1 inbound we should store.
 */
function resolvePhoneJid(
  msg: any,
  normalizePhone: (s: string) => string | null,
): {
  remoteJid: string;
  contactPhone: string | null;
} {
  const key = msg?.key || {};
  const candidates = [
    key.remoteJidAlt,
    key.participantAlt,

    msg.senderPn,
    key.senderPn,

    msg.message?.senderPn,

    key.remoteJid,
  ];

  for (const candidate of candidates) {
    const normalized = normalizePhone(candidate);
    if (normalized) {
      return {
        remoteJid: String(candidate),
        contactPhone: normalized,
      };
    }
  }
  return {
    remoteJid: String(key.remoteJid || ""),
    contactPhone: null,
  };
}
export function parseWaMessage(
  msg: any,
  normalizePhone: (s: string) => string | null,
): ParsedInbound | null {
  if (!msg?.key) return null;

  const key = msg.key;

  const fromMe = !!key.fromMe;
  const messageId = key.id ? String(key.id) : null;

  const phoneResult = resolvePhoneJid(msg, normalizePhone);

  const remoteJid = phoneResult.remoteJid;

  const contactPhoneE164 = phoneResult.contactPhone;
  const messageType = detectMessageType(msg.message);

  const extractedBody = extractBody(msg.message);
  const body = extractedBody || fallbackBodyByType(messageType);

  const pushName = msg.pushName ? String(msg.pushName) : null;
  console.log({
    remoteJid: key.remoteJid,
    remoteJidAlt: key.remoteJidAlt,
    participantAlt: key.participantAlt,
    senderPn: msg.senderPn,
    keySenderPn: key.senderPn,
  });
  return {
    messageId,
    remoteJid,
    contactPhoneE164,
    fromMe,
    body,
    messageType,
    pushName,
  };
}
