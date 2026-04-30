# accounts/email_utils.py
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.urls import reverse

def send_verification_email(user, request):
    """Send email verification link to user"""
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Build verification URL
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"
    
    subject = "Verify your SmartSeason account"
    message = f"""
    Hello {user.username or user.email},
    
    Welcome to SmartSeason! Please click the link below to verify your email address and activate your account:
    
    {verification_url}
    
    This link will expire in 24 hours.
    
    If you didn't create an account with SmartSeason, please ignore this email.
    
    Best regards,
    SmartSeason Team
    """
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #059669;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background-color: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e5e7eb;
            }}
            .button {{
                display: inline-block;
                background-color: #059669;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #6b7280;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🌾 SmartSeason</h1>
            <p>Field Monitoring System</p>
        </div>
        <div class="content">
            <h2>Welcome to SmartSeason, {user.username or user.email}!</h2>
            <p>Thank you for registering. Please verify your email address to start managing your fields.</p>
            <div style="text-align: center;">
                <a href="{verification_url}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #6b7280;">{verification_url}</p>
            <p><strong>Note:</strong> This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2024 SmartSeason. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
        html_message=html_message
    )
    print(f"📧 Verification email sent to {user.email}")

def send_welcome_email(user):
    """Send welcome email after verification"""
    subject = "Welcome to SmartSeason! 🎉"
    message = f"""
    Hello {user.username or user.email},
    
    Your email has been verified successfully! Welcome to SmartSeason.
    
    You can now log in to your account and start managing your fields.
    
    Best regards,
    SmartSeason Team
    """
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #059669;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background-color: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e5e7eb;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #6b7280;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🌾 SmartSeason</h1>
        </div>
        <div class="content">
            <h2>Welcome aboard, {user.username or user.email}! 🎉</h2>
            <p>Your email has been successfully verified. You are now ready to start managing your fields.</p>
            <div style="text-align: center;">
                <a href="{settings.FRONTEND_URL}/login" class="button" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Log In Now</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 SmartSeason. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
        html_message=html_message
    )
    print(f"📧 Welcome email sent to {user.email}")