from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create demo users for testing the application'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write('🚀 Creating demo users...')
        self.stdout.write('=' * 50)

        # Create Admin User
        admin_email = 'adminshambarecords@gmail.com'
        admin, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'username': 'admin_shamba',
                'first_name': 'Demo',
                'last_name': 'Admin',
                'role': 'admin',
                'is_active': True,
                'is_email_verified': True,
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            admin.set_password('Admin@123')
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Admin created: {admin_email}'))
            self.stdout.write(f'   Password: Admin@123')
        else:
            # Update existing user to ensure correct role and status
            admin.role = 'admin'
            admin.is_active = True
            admin.is_email_verified = True
            admin.is_staff = True
            admin.is_superuser = True
            admin.set_password('Admin@123')
            admin.save()
            self.stdout.write(self.style.WARNING(f'⚠️ Admin already existed, updated credentials'))
            self.stdout.write(f'   Email: {admin_email}')
            self.stdout.write(f'   Password: Admin@123')

        # Create Agent User
        agent_email = 'agentshambarecords@gmail.com'
        agent, created = User.objects.get_or_create(
            email=agent_email,
            defaults={
                'username': 'agent_shamba',
                'first_name': 'Demo',
                'last_name': 'Agent',
                'role': 'agent',
                'is_active': True,
                'is_email_verified': True
            }
        )
        
        if created:
            agent.set_password('agent123')
            agent.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Agent created: {agent_email}'))
            self.stdout.write(f'   Password: agent123')
        else:
            # Update existing user to ensure correct role and status
            agent.role = 'agent'
            agent.is_active = True
            agent.is_email_verified = True
            agent.set_password('agent123')
            agent.save()
            self.stdout.write(self.style.WARNING(f'⚠️ Agent already existed, updated credentials'))
            self.stdout.write(f'   Email: {agent_email}')
            self.stdout.write(f'   Password: agent123')

        # Summary
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('✅ Demo users are ready!'))
        self.stdout.write('=' * 50)
        self.stdout.write('\n📋 Demo Credentials:')
        self.stdout.write(f'   Admin:  {admin_email} / Admin@123')
        self.stdout.write(f'   Agent:  {agent_email} / agent123')
        self.stdout.write('\n🌐 Login at: https://shamba-records-smartseason-field-mo.vercel.app/')