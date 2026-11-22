/**
 * Password policy aligned with the API / bcrypt 72-byte input limit.
 * Measures UTF-8 bytes via TextEncoder — not JS string length.
 */

export const BCRYPT_MAX_PASSWORD_BYTES = 72;

export const PASSWORD_TOO_LONG_MESSAGE =
  "Password must be at most 72 UTF-8 bytes (bcrypt limit).";

export const PASSWORD_STRENGTH_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, and a number.";

export function passwordUtf8ByteLength(password: string): number {
  return new TextEncoder().encode(password).length;
}

export function isPasswordWithinBcryptLimit(password: string): boolean {
  return passwordUtf8ByteLength(password) <= BCRYPT_MAX_PASSWORD_BYTES;
}

export function meetsPasswordRequirements(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    isPasswordWithinBcryptLimit(password)
  );
}

export function validatePasswordForSubmit(password: string): string | null {
  if (!password) return "Password is required.";
  if (!isPasswordWithinBcryptLimit(password)) return PASSWORD_TOO_LONG_MESSAGE;
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return PASSWORD_STRENGTH_MESSAGE;
  }
  return null;
}

export function validateLoginPassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (!isPasswordWithinBcryptLimit(password)) return PASSWORD_TOO_LONG_MESSAGE;
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}
