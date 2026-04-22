from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import User
import logging

# Set up logging
logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def user_created_handler(sender, instance, created, **kwargs):
    """
    This signal fires every time a user is saved.
    When created=True, it means a new user was just created.
    """
    if created:
        # Get current counts
        total_users = User.objects.count()
        admin_count = User.objects.filter(role='admin').count()
        agent_count = User.objects.filter(role='agent').count()
        
        # Log to console
        print("\n" + "="*50)
        print(f"🎉 NEW USER REGISTERED!")
        print("="*50)
        print(f"📧 Email: {instance.email}")
        print(f"👤 Username: {instance.username}")
        print(f"🎭 Role: {instance.role}")
        print(f"📱 Phone: {instance.phone_number or 'Not provided'}")
        print(f"📍 Location: {instance.location or 'Not provided'}")
        print(f"🌾 Farm: {instance.farm_name or 'Not provided'}")
        print("-"*50)
        print(f"📊 UPDATED STATISTICS:")
        print(f"   Total Users: {total_users}")
        print(f"   Admins: {admin_count}")
        print(f"   Field Agents: {agent_count}")
        print(f"   Verified: {User.objects.filter(is_email_verified=True).count()}")
        print(f"   Unverified: {User.objects.filter(is_email_verified=False).count()}")
        print("="*50 + "\n")
        
        # Also log to Django's logging system
        logger.info(f"New user created: {instance.email} (Role: {instance.role})")
        logger.info(f"Total users now: {total_users}")
        
        # Optional: Send email notification to admin
        if instance.role == 'agent':
            try:
                send_mail(
                    subject=f'New Field Agent Registered - {instance.username}',
                    message=f"""
                    A new field agent has registered on SmartSeason!
                    
                    📧 Email: {instance.email}
                    👤 Username: {instance.username}
                    📱 Phone: {instance.phone_number or 'Not provided'}
                    📍 Location: {instance.location or 'Not provided'}
                    🌾 Farm: {instance.farm_name or 'Not provided'}
                    
                    Current Statistics:
                    - Total Users: {total_users}
                    - Total Agents: {agent_count}
                    - Total Admins: {admin_count}
                    
                    Login to the admin panel to verify this user if needed.
                    """,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=['admin@gmail.com'],  # Change to your admin email
                    fail_silently=True,  # Don't crash if email fails
                )
                print(f"📧 Admin notification email sent for {instance.email}")
            except Exception as e:
                print(f"⚠️ Could not send admin email: {e}")
        
        # Optional: Send welcome email to the new user
        try:
            send_mail(
                subject='Welcome to SmartSeason! 🚜',
                message=f"""
                Hello {instance.username},
                
                Welcome to SmartSeason Field Monitoring System!
                
                Your account has been successfully created with the following details:
                - Role: {instance.role}
                - Email: {instance.email}
                
                Next steps:
                1. Complete your profile with farm details
                2. Start adding your fields
                3. Track crop progress throughout the season
                
                If you haven't already, please verify your email address to get full access.
                
                Best regards,
                SmartSeason Team
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.email],
                fail_silently=True,
            )
            print(f"📧 Welcome email sent to {instance.email}")
        except Exception as e:
            print(f"⚠️ Could not send welcome email: {e}")