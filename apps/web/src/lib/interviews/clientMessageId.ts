/**
 * Deterministic client message IDs for idempotent saves (e.g. greeting).
 */

function bytesToUuid(bytes: number[]): string {
  const copy = bytes.slice(0, 16);
  while (copy.length < 16) copy.push(0);
  copy[6] = (copy[6] & 0x0f) | 0x50; // version 5
  copy[8] = (copy[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = copy.map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** Stable UUID for a given session + logical key (safe across refreshes). */
export function stableClientMessageId(sessionId: string, key: string): string {
  const raw = `${sessionId}|${key}`;
  const bytes = new Array<number>(16).fill(0);
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);
    bytes[index % 16] ^= code;
    bytes[(index * 3 + 7) % 16] =
      (bytes[(index * 3 + 7) % 16] + code * (index + 1)) & 0xff;
  }
  return bytesToUuid(bytes);
}

export function greetingClientMessageId(sessionId: string): string {
  return stableClientMessageId(sessionId, "greeting");
}

export function newClientMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older runtimes / tests without crypto.randomUUID.
  const bytes = Array.from({ length: 16 }, (_, index) => {
    const stamp = Date.now() + index * 17;
    return (stamp ^ (Math.floor(Math.random() * 256) * (index + 3))) & 0xff;
  });
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}
