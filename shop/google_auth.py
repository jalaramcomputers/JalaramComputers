"""Verify Google Identity Services ID tokens."""


def verify_google_id_token(token: str, client_id: str) -> dict:
    """Return token claims or raise ValueError."""
    try:
        from google.auth.transport import requests
        from google.oauth2 import id_token
    except ImportError as exc:
        raise ValueError('google-auth is not installed') from exc
    return id_token.verify_oauth2_token(
        token,
        requests.Request(),
        client_id,
        clock_skew_in_seconds=60,
    )
