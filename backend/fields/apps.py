from django.apps import AppConfig

class FieldsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fields'
    
    def ready(self):
        import fields.signals  # Register signals