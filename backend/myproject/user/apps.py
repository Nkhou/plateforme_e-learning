from django.apps import AppConfig


class UserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'user'
    def ready(self):
        import user.signals  # Import signals

# # your_app/apps.py
# from django.apps import AppConfig

# class YourAppConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'your_app'
    
#     def ready(self):
#         import your_app.signals  # Import signals