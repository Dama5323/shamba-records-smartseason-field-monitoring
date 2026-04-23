from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Observation, Field
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Observation)
def observation_created_handler(sender, instance, created, **kwargs):
    """Send notification when observation is added"""
    if created:
        field = instance.field
        agent = instance.agent
        
        # Log to console
        print(f"\n📝 New observation for field: {field.name}")
        print(f"   Agent: {agent.email}")
        print(f"   Note: {instance.note[:100]}...")
        
        # Notify admin if field is at risk
        if field.status == 'At Risk':
            try:
                # Get all admin users
                from accounts.models import User
                admins = User.objects.filter(role='admin')
                
                for admin in admins:
                    send_mail(
                        subject=f'⚠️ At Risk Alert: {field.name}',
                        message=f"""
                        Field: {field.name}
                        Crop: {field.crop_type}
                        Status: At Risk
                        Days since planting: {field.days_since_planting}
                        
                        Latest observation from {agent.email}:
                        {instance.note}
                        
                        Please review and take action.
                        """,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[admin.email],
                        fail_silently=True,
                    )
                print(f"   📧 Alert sent to {admins.count()} admin(s)")
            except Exception as e:
                print(f"   ⚠️ Could not send alert: {e}")

@receiver(post_save, sender=Field)
def field_status_changed_handler(sender, instance, created, **kwargs):
    """Log when field status changes"""
    if not created:
        # Check if status changed (compare with previous state)
        try:
            old = Field.objects.get(pk=instance.pk)
            if old.status != instance.status:
                print(f"\n🔄 Field status changed: {instance.name}")
                print(f"   From: {old.status} → To: {instance.status}")
                
                # Log status change
                logger.info(f"Field {instance.id} status changed from {old.status} to {instance.status}")
        except Field.DoesNotExist:
            pass