from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib import messages
from django.http import HttpResponseRedirect
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'is_email_verified', 'phone_number', 'location', 'is_active')
    list_filter = ('role', 'is_email_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'phone_number', 'location')
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'location', 'farm_name')}),
        ('Verification', {'fields': ('is_email_verified', 'is_active')}),
        ('Permissions', {'fields': ('role', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role', 
                      'phone_number', 'location', 'farm_name'),
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Add validation for Gmail when creating/editing from admin"""
        if not change:  # Only validate on creation
            email = form.cleaned_data.get('email')
            if email and not email.endswith('@gmail.com'):
                messages.error(request, "Only Gmail addresses are allowed to register.")
                return
        super().save_model(request, obj, form, change)

admin.site.register(User, CustomUserAdmin)