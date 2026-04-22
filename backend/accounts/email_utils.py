from django.core.mail import send_mail
from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.tokens import RefreshToken

def send_verification_email(user, request):
    """Send email verification link to user"""
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Create verification link (frontend URL)
    verification_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"
    
    subject = 'Verify Your Email - SmartSeason'
    message = f"""
    Hello {user.username},
    
    Thank you for registering with SmartSeason!
    
    Please click the link below to verify your email address:
    {verification_link}
    
    This link will expire in 3 days.
    
    If you didn't register for SmartSeason, please ignore this email.
    
    Best regards,
    SmartSeason Team
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

def send_welcome_email(user):
    """Send welcome email after verification"""
    subject = 'Welcome to SmartSeason!'
    message = f"""
    Hello {user.username},
    
    Your email has been verified successfully!
    
    You can now login to SmartSeason and start managing your fields.
    
    Best regards,
    SmartSeason Team
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )