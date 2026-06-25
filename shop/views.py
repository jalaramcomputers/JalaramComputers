"""Public page views. Thin renderers — all data is loaded client-side via the
JSON API in ``api_views`` (kept). Page metadata lives here, not in JSON files."""

import re
import secrets

from django.conf import settings
from django.shortcuts import redirect, render
from django.views.decorators.csrf import ensure_csrf_cookie

from .google_oauth import redirect_uri, start_url

NAV_LINKS = [
    {'href': '/', 'label': 'Home', 'key': 'home'},
    {'href': '/shop', 'label': 'Shop', 'key': 'shop'},
    {'href': '/services', 'label': 'Services', 'key': 'services'},
    {'href': '/about', 'label': 'About', 'key': 'about'},
    {'href': '/contact', 'label': 'Contact', 'key': 'contact'},
]


def _whatsapp_number() -> str:
    """Return a digits-only WhatsApp number with Indian country code."""
    raw = getattr(settings, 'SHOP_PHONE', '9892848643')
    digits = re.sub(r'\D', '', raw)
    return digits if digits.startswith('91') else f'91{digits}'


@ensure_csrf_cookie
def page(request, *, template, title, active=None, body_class='',
         splash=False, whatsapp=True, hero_preload=False, tabbar=True, **extra):
    ctx = {
        'title': title,
        'active_nav': active,
        'nav_links': NAV_LINKS,
        'body_class': body_class,
        'show_splash': splash,
        'whatsapp_float': whatsapp,
        'whatsapp_number': _whatsapp_number(),
        'hero_preload': hero_preload,
        'show_tabbar': tabbar,
    }
    ctx.update(extra)
    response = render(request, template, ctx)
    response['Cache-Control'] = 'no-store, no-cache, must-revalidate'
    return response


def home(request):
    return page(request, template='pages/home.html',
                title='Jalaram Computers — Your One-Stop IT Solution',
                active='home', body_class='jc-landing',
                splash=True, hero_preload=True)


def shop(request):
    return page(request, template='pages/shop.html',
                title='Shop — Jalaram Computers', active='shop')


def product(request):
    return page(request, template='pages/product.html',
                title='Product — Jalaram Computers', active='shop')


def cart(request):
    return page(request, template='pages/cart.html',
                title='Your Cart — Jalaram Computers', active='cart')


def checkout(request):
    return page(request, template='pages/checkout.html',
                title='Checkout — Jalaram Computers', whatsapp=False, tabbar=False)


def order_confirmed(request):
    return page(request, template='pages/order-confirmed.html',
                title='Order Confirmed — Jalaram Computers', whatsapp=False, tabbar=False)


def services(request):
    return page(request, template='pages/services.html',
                title='Services — Jalaram Computers', active='services')


def book_service(request):
    return page(request, template='pages/book-service.html',
                title='Book a Service — Jalaram Computers', active='services')


def about(request):
    return page(request, template='pages/about.html',
                title='About Us — Jalaram Computers', active='about')


def contact(request):
    return page(request, template='pages/contact.html',
                title='Contact — Jalaram Computers', active='contact')


def account(request):
    return page(request, template='pages/account.html',
                title='My Account — Jalaram Computers', active='account', whatsapp=False,
                google_oauth_enabled=bool(
                    settings.GOOGLE_OAUTH_CLIENT_ID and settings.GOOGLE_OAUTH_CLIENT_SECRET
                ))


def google_oauth_start(request):
    if not settings.GOOGLE_OAUTH_CLIENT_ID or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
        return redirect('/account?google_error=config')
    state = secrets.token_urlsafe(32)
    oauth_redirect_uri = redirect_uri(request)
    request.session['google_oauth_state'] = state
    request.session['google_oauth_redirect_uri'] = oauth_redirect_uri
    request.session.save()
    return redirect(start_url(request, state, oauth_redirect_uri))
