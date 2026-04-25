from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from fields.models import Field
from datetime import date, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup demo users and sample field data for the SmartSeason application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force recreate demo users even if they exist',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write('🌾 SmartSeason Demo Setup')
        self.stdout.write('=' * 50)
        
        # Create Admin User
        admin_email = 'admin@shambarecords.com'
        admin, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'username': 'admin',
                'role': 'admin',
                'is_active': True,
                'is_email_verified': True,
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created or force:
            admin.set_password('Admin@123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('✓ Admin user created/updated'))
            self.stdout.write(f'  Email: {admin_email}')
            self.stdout.write(f'  Password: Admin@123')
        else:
            self.stdout.write(f'ℹ Admin user already exists (use --force to reset password)')
        
        # Create Agent User
        agent_email = 'agent@shambarecords.com'
        agent, created = User.objects.get_or_create(
            email=agent_email,
            defaults={
                'username': 'field_agent',
                'role': 'agent',
                'is_active': True,
                'is_email_verified': True
            }
        )
        
        if created or force:
            agent.set_password('Agent@123')
            agent.save()
            self.stdout.write(self.style.SUCCESS('✓ Agent user created/updated'))
            self.stdout.write(f'  Email: {agent_email}')
            self.stdout.write(f'  Password: Agent@123')
        else:
            self.stdout.write(f'ℹ Agent user already exists (use --force to reset password)')
        
        # Create Sample Fields (if none exist or force)
        fields_created = 0
        fields_updated = 0
        
        sample_fields = [
            {
                'name': 'North Field',
                'crop_type': 'Maize',
                'planting_date': date.today() - timedelta(days=30),
                'current_stage': 'growing',
                'field_size': 10.5,
                'location': 'Northern Region',
                'soil_type': 'Loamy',
                'notes': 'Good rainfall this season'
            },
            {
                'name': 'South Field',
                'crop_type': 'Wheat',
                'planting_date': date.today() - timedelta(days=100),
                'current_stage': 'ready',
                'field_size': 15.0,
                'location': 'Southern Valley',
                'soil_type': 'Clay',
                'notes': 'Ready for harvest'
            },
            {
                'name': 'East Field',
                'crop_type': 'Rice',
                'planting_date': date.today() - timedelta(days=120),
                'current_stage': 'growing',
                'field_size': 8.0,
                'location': 'Eastern Plains',
                'soil_type': 'Silty',
                'notes': 'Monitor for pests'
            },
            {
                'name': 'West Field',
                'crop_type': 'Beans',
                'planting_date': date.today() - timedelta(days=45),
                'current_stage': 'growing',
                'field_size': 5.0,
                'location': 'Western Hills',
                'soil_type': 'Sandy',
                'notes': 'Looking healthy'
            },
            {
                'name': 'Central Field',
                'crop_type': 'Tomatoes',
                'planting_date': date.today() - timedelta(days=15),
                'current_stage': 'planted',
                'field_size': 3.5,
                'location': 'Central Region',
                'soil_type': 'Loamy',
                'notes': 'New plantation'
            }
        ]
        
        self.stdout.write('\n📋 Creating sample fields...')
        
        for field_data in sample_fields:
            field, created = Field.objects.get_or_create(
                name=field_data['name'],
                defaults={
                    **field_data,
                    'created_by': admin
                }
            )
            
            if created:
                fields_created += 1
                self.stdout.write(f'  ✓ Created: {field.name}')
            elif force:
                # Update existing field
                for key, value in field_data.items():
                    setattr(field, key, value)
                field.created_by = admin
                field.save()
                fields_updated += 1
                self.stdout.write(f'  ⟳ Updated: {field.name}')
            else:
                self.stdout.write(f'  ℹ Already exists: {field.name}')
        
        # Assign all fields to agent
        self.stdout.write('\n👤 Assigning fields to agent...')
        assigned_count = 0
        for field in Field.objects.all():
            if not field.assigned_to or force:
                field.assigned_to = agent
                field.save()
                assigned_count += 1
                self.stdout.write(f'  → Assigned: {field.name} -> {agent.username}')
        
        # Create sample observations
        self.stdout.write('\n📝 Creating sample observations...')
        observations_created = 0
        
        from fields.models import Observation
        
        sample_observations = [
            {
                'field_name': 'North Field',
                'note': 'Crop is growing well. Good color and height.',
                'crop_health': 'good'
            },
            {
                'field_name': 'South Field',
                'note': 'Wheat is ready for harvest. Planning harvest for next week.',
                'crop_health': 'excellent'
            },
            {
                'field_name': 'East Field',
                'note': 'Rice showing signs of pest. Treatment applied.',
                'crop_health': 'fair',
                'pest_disease_issues': 'Minor pest infestation detected'
            }
        ]
        
        for obs_data in sample_observations:
            try:
                field = Field.objects.get(name=obs_data['field_name'])
                observation, created = Observation.objects.get_or_create(
                    field=field,
                    agent=agent,
                    note=obs_data['note'],
                    defaults={
                        'crop_health': obs_data.get('crop_health'),
                        'pest_disease_issues': obs_data.get('pest_disease_issues', '')
                    }
                )
                if created:
                    observations_created += 1
                    self.stdout.write(f'  ✓ Observation added for {field.name}')
            except Field.DoesNotExist:
                pass
        
        # Summary
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS('✅ DEMO SETUP COMPLETE'))
        self.stdout.write('=' * 50)
        self.stdout.write(f'\n📊 Summary:')
        self.stdout.write(f'  • Admin user: {"created" if created else "existing"}')
        self.stdout.write(f'  • Agent user: {"created" if created else "existing"}')
        self.stdout.write(f'  • Fields: {fields_created} created, {fields_updated} updated')
        self.stdout.write(f'  • Field assignments: {assigned_count}')
        self.stdout.write(f'  • Observations: {observations_created} created')
        
        self.stdout.write('\n🔐 Demo Credentials:')
        self.stdout.write(self.style.SUCCESS('  Admin:  admin@shambarecords.com / Admin@123'))
        self.stdout.write(self.style.SUCCESS('  Agent:  agent@shambarecords.com / Agent@123'))
        
        self.stdout.write('\n🌾 SmartSeason is ready to use!')