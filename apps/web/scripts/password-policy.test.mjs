/**
 * Lightweight Node checks for UTF-8 bcrypt password limits.
 * Run: node scripts/password-policy.test.mjs
 */

import assert from "node:assert/strict";

const BCRYPT_MAX_PASSWORD_BYTES = 72;

function passwordUtf8ByteLength(password) {
  return new TextEncoder().encode(password).length;
}

function isPasswordWithinBcryptLimit(password) {
  return passwordUtf8ByteLength(password) <= BCRYPT_MAX_PASSWORD_BYTES;
}

const boundary = `${"a".repeat(70)}A1`;
assert.equal(passwordUtf8ByteLength(boundary), 72);
assert.equal(isPasswordWithinBcryptLimit(boundary), true);

const oversized = `${"a".repeat(71)}A1`;
assert.equal(passwordUtf8ByteLength(oversized), 73);
assert.equal(isPasswordWithinBcryptLimit(oversized), false);

const multibyte = `É${"é".repeat(39)}1aA`;
assert.ok(passwordUtf8ByteLength(multibyte) > 72);
assert.equal(isPasswordWithinBcryptLimit(multibyte), false);

console.log("password-policy.test.mjs: ok");
