import os
import requests
import json
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Automatically renew Render PostgreSQL database before expiration'

    def add_arguments(self, parser):
        parser.add_argument('--api-key', type=str, help='Render API Key')
        parser.add_argument('--service-id', type=str, help='Render Service ID')
        parser.add_argument('--dry-run', action='store_true', help='Test without making changes')

    def handle(self, *args, **options):
        api_key = options.get('api_key') or os.getenv('RENDER_API_KEY')
        service_id = options.get('service_id') or os.getenv('RENDER_SERVICE_ID')
        dry_run = options.get('dry_run', False)

        if not api_key or not service_id:
            self.stdout.write(self.style.ERROR('❌ Missing RENDER_API_KEY or RENDER_SERVICE_ID'))
            self.stdout.write('Set them as environment variables or pass via --api-key and --service-id')
            return

        self.stdout.write('=' * 50)
        self.stdout.write('🔄 Starting Database Renewal Process')
        self.stdout.write(f'📅 Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write('=' * 50)

        # Step 1: Create backup
        self.stdout.write('\n📦 Step 1: Creating database backup...')
        if dry_run:
            self.stdout.write(self.style.WARNING('   [DRY RUN] Would create backup'))
        else:
            backup_result = self.create_backup(api_key, service_id)
            if not backup_result:
                self.stdout.write(self.style.ERROR('❌ Backup failed. Aborting.'))
                return
            self.stdout.write(self.style.SUCCESS('✅ Backup created successfully'))

        # Step 2: Delete old database
        self.stdout.write('\n🗑️ Step 2: Deleting old database...')
        if dry_run:
            self.stdout.write(self.style.WARNING('   [DRY RUN] Would delete old database'))
        else:
            if self.delete_database(api_key, service_id):
                self.stdout.write(self.style.SUCCESS('✅ Old database deleted'))
            else:
                self.stdout.write(self.style.ERROR('❌ Failed to delete database'))

        # Step 3: Create new database
        self.stdout.write('\n✨ Step 3: Creating new database...')
        if dry_run:
            self.stdout.write(self.style.WARNING('   [DRY RUN] Would create new database'))
        else:
            new_db = self.create_database(api_key)
            if new_db:
                self.stdout.write(self.style.SUCCESS('✅ New database created'))
                self.stdout.write(f'   New DB ID: {new_db.get("id")}')
            else:
                self.stdout.write(self.style.ERROR('❌ Failed to create database'))

        # Step 4: Restore backup
        self.stdout.write('\n🔄 Step 4: Restoring backup to new database...')
        if dry_run:
            self.stdout.write(self.style.WARNING('   [DRY RUN] Would restore backup'))
        else:
            if self.restore_backup(api_key, service_id):
                self.stdout.write(self.style.SUCCESS('✅ Backup restored successfully'))

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS('🎉 Database renewal completed!'))
        self.stdout.write('=' * 50)

    def create_backup(self, api_key, service_id):
        """Create a backup dump of the current database"""
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            url = f'https://api.render.com/v1/postgres/{service_id}/backup'
            response = requests.post(url, headers=headers)
            
            if response.status_code in [200, 201, 202]:
                self.stdout.write('   Backup initiated successfully')
                return True
            else:
                self.stdout.write(f'   Backup failed: {response.text}')
                return False
        except Exception as e:
            self.stdout.write(f'   Error: {str(e)}')
            return False

    def delete_database(self, api_key, service_id):
        """Delete the expiring database"""
        try:
            headers = {'Authorization': f'Bearer {api_key}'}
            url = f'https://api.render.com/v1/postgres/{service_id}'
            response = requests.delete(url, headers=headers)
            
            if response.status_code in [200, 202, 204]:
                return True
            else:
                self.stdout.write(f'   Delete failed: {response.text}')
                return False
        except Exception as e:
            self.stdout.write(f'   Error: {str(e)}')
            return False

    def create_database(self, api_key):
        """Create a new PostgreSQL database"""
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            url = 'https://api.render.com/v1/postgres'
            payload = {
                "name": "smartseason-db",
                "plan": "free",
                "region": "oregon",
                "databaseName": "smartseason",
                "postgresMajorVersion": 15
            }
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                self.stdout.write(f'   Create failed: {response.text}')
                return None
        except Exception as e:
            self.stdout.write(f'   Error: {str(e)}')
            return None

    def restore_backup(self, api_key, service_id):
        """Restore backup to new database"""
        try:
            headers = {'Authorization': f'Bearer {api_key}'}
            url = f'https://api.render.com/v1/postgres/{service_id}/restore'
            response = requests.post(url, headers=headers)
            
            if response.status_code in [200, 201, 202]:
                return True
            else:
                self.stdout.write(f'   Restore failed: {response.text}')
                return False
        except Exception as e:
            self.stdout.write(f'   Error: {str(e)}')
            return False