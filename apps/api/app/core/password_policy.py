"""Shared password policy aligned with bcrypt's 72-byte input limit."""

from __future__ import annotations

BCRYPT_MAX_PASSWORD_BYTES = 72

PASSWORD_TOO_LONG_MESSAGE = (
    "Password must be at most 72 UTF-8 bytes (bcrypt limit)."
)


def password_utf8_byte_length(password: str) -> int:
    return len(password.encode("utf-8"))


def validate_password_byte_length(password: str) -> str:
    """Reject passwords that exceed bcrypt's supported input length.

    Does not truncate. Measures UTF-8 bytes, not Python character count.
    """
    if password_utf8_byte_length(password) > BCRYPT_MAX_PASSWORD_BYTES:
        raise ValueError(PASSWORD_TOO_LONG_MESSAGE)
    return password
