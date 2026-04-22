from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
import requests
from .models import User

User = get_user_model()

class GoogleSocialAuth(APIView):
    permission_classes = []
    
    def post(self, request):
        access_token = request.data.get('access_token')
        
        if not access_token:
            return Response({'error': 'Access token required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Verify token with Google
        google_url = f'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={access_token}'
        response = requests.get(google_url)
        
        if response.status_code != 200:
            return Response({'error': 'Invalid token'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        user_data = response.json()
        email = user_data.get('email')
        
        # Restrict to Gmail
        if not email or not email.endswith('@gmail.com'):
            return Response({'error': 'Only Gmail accounts are allowed'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': user_data.get('given_name', ''),
                'last_name': user_data.get('family_name', ''),
            }
        )
        
        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role
            }
        })

class FacebookSocialAuth(APIView):
    permission_classes = []
    
    def post(self, request):
        access_token = request.data.get('access_token')
        
        if not access_token:
            return Response({'error': 'Access token required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Verify token with Facebook
        fb_url = f'https://graph.facebook.com/me?access_token={access_token}&fields=id,name,email,first_name,last_name'
        response = requests.get(fb_url)
        
        if response.status_code != 200:
            return Response({'error': 'Invalid token'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        user_data = response.json()
        email = user_data.get('email')
        
        # Restrict to Gmail for Facebook as well (optional)
        if not email or not email.endswith('@gmail.com'):
            return Response({'error': 'Only Gmail accounts are allowed'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': user_data.get('first_name', ''),
                'last_name': user_data.get('last_name', ''),
            }
        )
        
        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role
            }
        })