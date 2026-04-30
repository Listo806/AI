/**
 * Extract normalized fields from Baileys WAMessage for QR inbound pipeline.
 */

export type ParsedInbound = {
  messageId: string | null;
  remoteJid: string;
  contactPhoneE164: string | null;
  fromMe: boolean;
  body: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'sticker';
  pushName: string | null;
};

/**
 * Best-effort text extraction from proto message.
 */
function extractBody(message: any): string {
  if (!message) return '';
  const m = message;
  if (m.conversation) return String(m.conversation);
  if (m.extendedTextMessage?.text) return String(m.extendedTextMessage.text);
  if (m.imageMessage?.caption) return String(m.imageMessage.caption);
  if (m.videoMessage?.caption) return String(m.videoMessage.caption);
  if (m.documentMessage?.caption) return String(m.documentMessage.caption);
  if (m.buttonsResponseMessage?.selectedDisplayText)
    return String(m.buttonsResponseMessage.selectedDisplayText);
  if (m.listResponseMessage?.title)
    return String(m.listResponseMessage.title);
  return '';
}

function detectMessageType(message: any): ParsedInbound['messageType'] {
  if (!message) return 'text';
  if (message.conversation || message.extendedTextMessage) return 'text';
  if (message.imageMessage) return 'image';
  if (message.audioMessage) return 'audio';
  if (message.videoMessage) return 'video';
  if (message.documentMessage) return 'document';
  if (message.locationMessage) return 'location';
  if (message.stickerMessage) return 'sticker';
  return 'text';
}

/**
 * Parse a single WAMessage. Returns null if not a 1:1 inbound we should store.
 */
export function parseWaMessage(msg: any, normalizePhone: (s: string) => string | null): ParsedInbound | null {
  if (!msg?.key) return null;
  const key = msg.key;
  const remoteJid = key.remoteJid || '';
  // Groups / broadcast
  if (remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') return null;

  const fromMe = !!key.fromMe;
  const messageId = key.id ? String(key.id) : null;
  const contactPhoneE164 = normalizePhone(remoteJid);
  const body = extractBody(msg.message).trim();
  const messageType = detectMessageType(msg.message);
  const pushName = msg.pushName ? String(msg.pushName) : null;

  return {
    messageId,
    remoteJid,
    contactPhoneE164,
    fromMe,
    body: body || (messageType !== 'text' ? `[${messageType}]` : ''),
    messageType,
    pushName,
  };
}
