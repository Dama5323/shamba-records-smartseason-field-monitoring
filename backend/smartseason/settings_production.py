import os
import dj_database_url
from .settings import *

# ========== AUTO-CREATE ADMIN USER ==========
# This runs during build on Render
import sys

if os.environ.get('RENDER', 'False') == 'True' or os.environ.get('DATABASE_URL'):
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if not User.objects.filter(role='admin').exists():
            print("=" * 50)
            print("🚀 Creating default admin user...")
            print("=" * 50)
            
            admin = User.objects.create(
                email='admin@shambarecords.com',
                username='admin',
                first_name='System',
                last_name='Admin',
                role='admin',
                is_active=True,
                is_email_verified=True,
                is_staff=True,
                is_superuser=True
            )
            admin.set_password('Admin@123')
            admin.save()
            
            print("✅ Admin created: admin@shambarecords.com / Admin@123")
            print("=" * 50)
        else:
            print("✓ Admin user already exists")
    except Exception as e:
        print(f"⚠️ Could not create admin: {e}")

# ========== YOUR EXISTING PRODUCTION SETTINGS ==========
DEBUG = False

# Security
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,.onrender.com').split(',')

# Database - Use Render PostgreSQL
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True
        )
    }

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'mediafiles')

# Security headers
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# Add WhiteNoise middleware
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}