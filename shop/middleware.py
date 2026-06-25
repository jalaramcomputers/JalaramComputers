"""Privacy-friendly visitor analytics.

Records one PageView per real storefront HTML page load so the admin dashboard
can report visits and unique visitors. Deliberately cheap and fail-safe — it
never blocks or breaks a page if logging fails, and it ignores admin, API,
static assets, and obvious bots.
"""
import logging
import uuid

logger = logging.getLogger(__name__)

VISITOR_COOKIE = 'jc_vid'
VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 730  # ~2 years

# Never log these prefixes — they are not storefront page views.
_SKIP_PREFIXES = (
    '/admin', '/api', '/assets', '/static', '/media',
    '/favicon', '/robots', '/sitemap', '/account/google',
)
_BOT_HINTS = (
    'bot', 'crawl', 'spider', 'slurp', 'bingpreview', 'facebookexternalhit',
    'embedly', 'pingdom', 'monitor', 'headlesschrome', 'lighthouse', 'curl',
    'wget', 'python-requests', 'go-http-client',
)


class PageViewMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            self._record(request, response)
        except Exception:  # analytics must never break the site
            logger.debug('PageView logging skipped', exc_info=True)
        return response

    def _should_skip(self, request, response):
        if request.method != 'GET':
            return True
        if getattr(response, 'status_code', 0) != 200:
            return True
        path = request.path or '/'
        if any(path.startswith(p) for p in _SKIP_PREFIXES):
            return True
        ctype = response.headers.get('Content-Type', '') if hasattr(response, 'headers') else ''
        if 'text/html' not in ctype:
            return True
        ua = request.META.get('HTTP_USER_AGENT', '').lower()
        if not ua or any(hint in ua for hint in _BOT_HINTS):
            return True
        return False

    def _record(self, request, response):
        if self._should_skip(request, response):
            return

        visitor_id = request.COOKIES.get(VISITOR_COOKIE)
        new_visitor = not visitor_id
        if new_visitor:
            visitor_id = uuid.uuid4().hex

        # Import here so app-loading order / migrations are never blocked.
        from .models import PageView

        user = getattr(request, 'user', None)
        PageView.objects.create(
            path=request.path[:300],
            visitor_id=visitor_id[:64],
            session_key=(request.session.session_key or '')[:64] if hasattr(request, 'session') else '',
            referrer=request.META.get('HTTP_REFERER', '')[:500],
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:400],
            is_authenticated=bool(user and user.is_authenticated),
        )

        if new_visitor:
            response.set_cookie(
                VISITOR_COOKIE, visitor_id,
                max_age=VISITOR_COOKIE_MAX_AGE,
                samesite='Lax', httponly=True,
            )
