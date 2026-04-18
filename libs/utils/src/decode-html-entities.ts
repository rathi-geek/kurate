const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&#x27;": "'",
};

const ENTITY_RE = /&(?:#(\d+)|#x([0-9a-fA-F]+)|[a-z]+);/gi;

export function decodeHtmlEntities(text: string): string;
export function decodeHtmlEntities(text: null | undefined): undefined;
export function decodeHtmlEntities(text: string | null | undefined): string | undefined;
export function decodeHtmlEntities(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  return text.replace(ENTITY_RE, (match, dec, hex) => {
    if (dec) return String.fromCharCode(parseInt(dec, 10));
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    return ENTITY_MAP[match.toLowerCase()] ?? match;
  });
}
