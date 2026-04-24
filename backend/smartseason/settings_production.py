import os
import dj_database_url
from .settings import *
from dotenv import load_dotenv

load_dotenv()

# Production settings - override development settings
DEBUG = False

# Security - IMPORTANT: Change this to your actual Render URL
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.onrender.com',  # Allows all Render subdomains
    'smartseason-backend.onrender.com',  # Your backend URL (change this)
]

# Database - Using your Render PostgreSQL
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files - For production, use Cloudinary or AWS S3
# For now, we'll use local storage (files will be lost on redeploy)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'mediafiles')

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS settings - Allow your frontend (update with your frontend URL)
CORS_ALLOWED_ORIGINS = [
    "https://smartseason-frontend.onrender.com",  # Your frontend URL
    "http://localhost:3000",  # Local development
    "http://localhost:5173",   # Vite default
]

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# Logging for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# WhiteNoise for static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')