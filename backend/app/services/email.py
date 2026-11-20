"""Email delivery helpers.

TODO: Wire real SMTP (or a transactional provider) when credentials are available.
Until SMTP_ENABLED=true, reset links are returned in API responses for local dev.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    settings = get_settings()
    if not settings.smtp_enabled:
        logger.warning(
            "SMTP disabled — password reset for %s would go to: %s",
            to_email,
            reset_url,
        )
        return False

    msg = EmailMessage()
    msg["Subject"] = "Reset your InterviewX password"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.set_content(
        "You requested a password reset for InterviewX.\n\n"
        f"Open this link to choose a new password:\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
    return True
