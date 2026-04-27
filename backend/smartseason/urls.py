"""
URL configuration for smartseason project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os
import json

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.management import call_command
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


@csrf_exempt
def renew_database_webhook(request):
    """Webhook endpoint for cron-job.org to trigger database renewal"""
    if request.method == 'POST':
        try:
            # Verify secret key (optional but recommended)
            auth_header = request.headers.get('X-API-Key')
            expected_key = os.getenv('CRON_SECRET_KEY', '')
            
            if expected_key and auth_header != expected_key:
                return JsonResponse({'error': 'Unauthorized'}, status=401)
            
            # Run the renewal command
            call_command('renew_database', dry_run=False)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Database renewal initiated'
            }, status=200)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'POST required'}, status=405)

@csrf_exempt
def health_check(request):
    return JsonResponse({"status": "ok", "message": "Server is running"})

def home(request):
    return HttpResponse("""
    <html>
        <head><title>SmartSeason API</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>🌾 SmartSeason Field Monitoring API</h1>
            <p>Welcome to the SmartSeason API!</p>
            <p>
                <a href="/api/docs/" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    📚 View API Documentation (Swagger)
                </a>
            </p>
            <p>
                <a href="/api/redoc/" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    📖 View ReDoc Documentation
                </a>
            </p>
            <p>
                <a href="/admin/" style="background: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    🔧 Admin Panel
                </a>
            </p>
        </body>
    </html>
    """)

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/', include('fields.urls')),
    path('health/', health_check, name='health_check'),
    path('api/renew-database/', renew_database_webhook, name='renew-database'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)