from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Import here to avoid AppRegistryNotReady error
        import os
        from django.core.management import call_command
        
        # Only create admin on Render production
        if os.environ.get('RENDER', 'False') == 'True' or os.environ.get('DATABASE_URL'):
            try:
                call_command('ensure_admin')
            except Exception as e:
                print(f"Could not ensure admin: {e}")