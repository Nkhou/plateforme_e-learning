# create_superuser.py
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')  # Changed this line
django.setup()

def create_superuser():
    User = get_user_model()
    username = os.environ.get('SUPERUSER_USERNAME', 'admin')
    email = os.environ.get('SUPERUSER_EMAIL', 'admin@example.com')
    password = os.environ.get('SUPERUSER_PASSWORD', 'admin123')
    first_name = os.environ.get('SUPERUSER_FIRSTNAME', 'admin')
    last_name = os.environ.get('SUPERUSER_LASTNAME', 'admin')
    
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            privilege='A'  # Admin privilege
        )
        print(f"Superuser '{username}' created successfully!")
    else:
        print(f"Superuser '{username}' already exists.")

if __name__ == '__main__':
    create_superuser()