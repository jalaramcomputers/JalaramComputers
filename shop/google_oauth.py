"""Server-side Google OAuth 2.0 (authorization code flow). No GIS popup."""
import json
import urllib.request
from urllib import parse

from django.conf import settings

GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
SCOPES = 'openid email profile'


def redirect_uri(request) -> str:
    return request.build_absolute_uri('/account/google/callback/')


def start_url(request, state: str) -> str:
    params = {
        'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
        'redirect_uri': redirect_uri(request),
        'response_type': 'code',
        'scope': SCOPES,
        'state': state,
        'access_type': 'online',
        'prompt': 'select_account',
    }
    return f'{GOOGLE_AUTH_URL}?{parse.urlencode(params)}'


def exchange_auth_code(http_request, code: str) -> dict:
    secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', '')
    if not secret:
        raise ValueError('Google OAuth client secret is not configured.')

    body = parse.urlencode({
        'code': code,
        'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
        'client_secret': secret,
        'redirect_uri': redirect_uri(http_request),
        'grant_type': 'authorization_code',
    }).encode()

    req = urllib.request.Request(GOOGLE_TOKEN_URL, data=body, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode())
