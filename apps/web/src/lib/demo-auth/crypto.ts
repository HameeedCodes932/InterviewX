/**
 * DEMO-ONLY password hashing via Web Crypto PBKDF2.
 * Not production-grade auth — salt+hash live in the browser and can be
 * inspected or cleared by anyone with access to this machine.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      // Copy into a fresh ArrayBuffer-backed view for DOM lib typing.
      salt: Uint8Array.from(salt),
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<{
  passwordHash: string;
  salt: string;
  iterations: number;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  return {
    passwordHash: toBase64(derived),
    salt: toBase64(salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
  salt: string,
  iterations: number,
): Promise<boolean> {
  const derived = await deriveKey(password, fromBase64(salt), iterations);
  const expected = fromBase64(passwordHash);
  return timingSafeEqual(derived, expected);
}
