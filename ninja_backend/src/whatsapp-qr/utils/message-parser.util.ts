/**
 * Parse Baileys message payload to text body and message_type.
 * Extended when Baileys is wired (image, audio, etc.).
 */
export type ParsedInbound = {
  body: string | null;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'sticker';
};

export function parseInboundBody(_baileysMessage: unknown): ParsedInbound {
  // Placeholder until Baileys message shape is wired
  return { body: null, messageType: 'text' };
}
