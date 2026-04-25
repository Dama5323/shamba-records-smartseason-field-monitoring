from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Ensure an admin user exists'

    def handle(self, *args, **options):
        try:
            if not User.objects.filter(role='admin').exists():
                self.stdout.write('🚀 Creating default admin user...')
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
                self.stdout.write(self.style.SUCCESS('✅ Admin created: admin@shambarecords.com / Admin@123'))
            else:
                self.stdout.write('✓ Admin user already exists')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️ Could not create admin: {e}'))