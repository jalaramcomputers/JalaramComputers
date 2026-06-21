"""Create or update the single store owner admin account for /admin."""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from shop.models import SiteSettings

OWNER_USERNAME = 'jcowner'


class Command(BaseCommand):
    help = (
        'Create or update the one allowed Django superuser (default username: jcowner). '
        'Any other superusers are demoted.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--username', default=os.environ.get('ADMIN_USERNAME', OWNER_USERNAME))
        parser.add_argument('--email', default=os.environ.get('ADMIN_EMAIL', 'jalaramcomputers21@gmail.com'))
        parser.add_argument('--password', default=os.environ.get('ADMIN_PASSWORD', 'admin123'))

    def handle(self, *args, **options):
        User = get_user_model()
        username = (options['username'] or OWNER_USERNAME).strip()
        email = options['email'].strip().lower()
        password = options['password']

        if not password:
            raise CommandError('Password required — set ADMIN_PASSWORD or pass --password.')

        demoted = User.objects.filter(is_superuser=True).exclude(username=username).update(
            is_superuser=False,
            is_staff=False,
        )
        if demoted:
            self.stdout.write(self.style.WARNING(f'Demoted {demoted} other superuser(s).'))

        user = User.objects.filter(username=username).first()
        if not user and email:
            user = User.objects.filter(email__iexact=email).first()

        if user:
            user.username = username
            user.is_staff = True
            user.is_superuser = True
            user.email = email
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Updated owner account: {username}'))
        else:
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Created owner account: {username}'))

        SiteSettings.load()
        self.stdout.write('Sign in at /admin/ with your username and password (not email).')
