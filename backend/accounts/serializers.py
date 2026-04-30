from rest_framework import serializers
from .models import User
import re

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'role', 'first_name', 'last_name', 
                  'phone_number', 'location', 'farm_name']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
            'phone_number': {'required': False, 'allow_null': True},
            'location': {'required': False, 'allow_null': True},
            'farm_name': {'required': False, 'allow_null': True}
        }

    def validate_email(self, value):
        """Check if email is Gmail and not already registered"""
        if not value.endswith('@gmail.com'):
            raise serializers.ValidationError("Only Gmail addresses are allowed to register.")
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered. Please use a different email.")
        
        return value

    def validate_username(self, value):
        """Check if username already exists"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken. Please choose another username.")
        return value

    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value and not re.match(r'^\+?1?\d{9,15}$', value):
            raise serializers.ValidationError("Phone number must be valid (9-15 digits, optional + prefix)")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    