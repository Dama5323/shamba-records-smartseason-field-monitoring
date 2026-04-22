from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('agent', 'Field Agent'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='agent')
    
    # Make email required and unique
    email = models.EmailField(unique=True)

    # Email verification
    is_email_verified = models.BooleanField(default=False)
    
    # New fields for farmers/agents
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True, help_text="Farm location or address")
    farm_name = models.CharField(max_length=100, blank=True, null=True)
    
    # Tell Django to use email for authentication instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # username is still required but not for login

    def __str__(self):
        return f"{self.email} ({self.role})"