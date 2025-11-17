# /app/myproject/user/management/commands/createsuperuserauto.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import OperationalError, ProgrammingError
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Automatically creates a superuser if it does not exist'

    def handle(self, *args, **options):
        username = os.environ.get('SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('SUPERUSER_EMAIL', 'admin@example.com')
        password = os.environ.get('SUPERUSER_PASSWORD', 'adminpassword')

        try:
            # Check if the user table exists first
            if not User.objects.exists():
                # Try to check if user exists, but handle case when table doesn't exist
                if not User.objects.filter(username=username).exists():
                    User.objects.create_superuser(username, email, password)
                    self.stdout.write(
                        self.style.SUCCESS(f'Superuser {username} created successfully')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Superuser {username} already exists')
                    )
        except (OperationalError, ProgrammingError) as e:
            # Handle the case when the table doesn't exist yet
            self.stdout.write(
                self.style.WARNING(f'Database tables not ready yet: {e}')
            )
            # You could create the user after migrations are done
            # Or schedule this to run after migrations complete