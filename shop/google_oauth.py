"""Server-side Google OAuth 2.0 (authorization code flow). No GIS popup."""
import json
import logging
import urllib.error
import urllib.request
from urllib import parse

from django.conf import settings

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
SCOPES = 'openid email profile'
CALLBACK_PATH = '/account/google/callback/'


def redirect_uri(request=None) -> str:
    """Must match Google Console → Authorized redirect URIs character-for-character."""
    explicit = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', '')
    if explicit:
        return explicit if explicit.endswith('/') else f'{explicit}/'

    site = (getattr(settings, 'SITE_URL', '') or '').rstrip('/')
    if site:
        return f'{site}{CALLBACK_PATH}'

    if request is not None:
        return request.build_absolute_uri(CALLBACK_PATH)

    return f'http://localhost:8000{CALLBACK_PATH}'


def start_url(request, state: str, oauth_redirect_uri: str) -> str:
    params = {
        'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
        'redirect_uri': oauth_redirect_uri,
        'response_type': 'code',
        'scope': SCOPES,
        'state': state,
        'access_type': 'online',
        'prompt': 'select_account',
    }
    return f'{GOOGLE_AUTH_URL}?{parse.urlencode(params)}'


def exchange_auth_code(code: str, oauth_redirect_uri: str) -> dict:
    secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', '')
    if not secret:
        raise ValueError('secret_missing')

    body = parse.urlencode({
        'code': code,
        'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
        'client_secret': secret,
        'redirect_uri': oauth_redirect_uri,
        'grant_type': 'authorization_code',
    }).encode()

    req = urllib.request.Request(GOOGLE_TOKEN_URL, data=body, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode() if exc.fp else ''
        try:
            err = json.loads(raw)
            msg = err.get('error_description') or err.get('error') or raw
        except json.JSONDecodeError:
            msg = raw or str(exc)
        logger.warning('Google token HTTP %s: %s', exc.code, msg)
        raise ValueError(f'token_http:{msg[:120]}') from exc
    except urllib.error.URLError as exc:
        logger.warning('Google token network error: %s', exc)
        raise ValueError('token_network') from exc

    if data.get('error'):
        msg = data.get('error_description') or data.get('error')
        logger.warning('Google token error: %s', msg)
        raise ValueError(f'token:{msg}')

    return data


def get_user_info(access_token: str) -> dict:
    """Fetch profile claims from Google's userinfo endpoint using an access token."""
    req = urllib.request.Request(
        GOOGLE_USERINFO_URL,
        headers={'Authorization': f'Bearer {access_token}'},
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode() if exc.fp else ''
        logger.warning('Google userinfo HTTP %s: %s', exc.code, raw[:120])
        raise ValueError(f'userinfo_http:{exc.code}') from exc
    except urllib.error.URLError as exc:
        logger.warning('Google userinfo network error: %s', exc)
        raise ValueError('userinfo_network') from exc
