#!/bin/bash

# Exit on error
set -o errexit

echo "🚀 Starting build process..."

echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🗄️ Running migrations..."
python manage.py migrate --noinput

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "👤 Creating superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        email='admin@example.com',
        username='admin',
        password='admin123',
        first_name='Admin',
        last_name='User',
        role='admin',
        is_active=True,
        is_staff=True,
        is_superuser=True
    )
    print("✅ Superuser created successfully")
else:
    print("✅ Superuser already exists")
EOF

echo "✅ Build completed successfully!"