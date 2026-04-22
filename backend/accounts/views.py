from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_str
from .serializers import UserSerializer
from .email_utils import send_verification_email, send_welcome_email
from .models import User
from rest_framework.permissions import IsAuthenticated


class RegisterView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Set user as inactive until email verification
            user.is_active = False
            user.save()
            
            # Send verification email
            try:
                send_verification_email(user, request)
                return Response({
                    'message': 'Registration successful! Please check your email to verify your account.',
                    'email': user.email
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                # If email fails, delete the user
                user.delete()
                return Response({
                    'error': 'Could not send verification email. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = []
    
    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        
        if user and default_token_generator.check_token(user, token):
            # Verify email
            user.is_email_verified = True
            user.is_active = True
            user.save()
            
            # Send welcome email
            try:
                send_welcome_email(user)
            except:
                pass  # Don't fail if welcome email fails
            
            return Response({
                'message': 'Email verified successfully! You can now login.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid or expired verification link.'
            }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Check if it's a Gmail address
        if not email.endswith('@gmail.com'):
            return Response({'error': 'Only Gmail accounts are allowed'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        user = authenticate(request, username=email, password=password)
        
        if user:
            # Check if email is verified
            if not user.is_email_verified:
                return Response({
                    'error': 'Please verify your email before logging in. Check your inbox.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'phone_number': user.phone_number,
                    'location': user.location,
                    'farm_name': user.farm_name
                }
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class ResendVerificationEmailView(APIView):
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        
        try:
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response({
                    'error': 'Email already verified.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            send_verification_email(user, request)
            return Response({
                'message': 'Verification email resent. Please check your inbox.'
            })
        except User.DoesNotExist:
            return Response({
                'error': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)


class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only admins can see stats
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized. Admin access required.'}, status=403)
        
        stats = {
            'total_users': User.objects.count(),
            'by_role': {
                'admin': User.objects.filter(role='admin').count(),
                'agent': User.objects.filter(role='agent').count(),
            },
            'by_verification': {
                'verified': User.objects.filter(is_email_verified=True).count(),
                'unverified': User.objects.filter(is_email_verified=False).count(),
            },
            'by_status': {
                'active': User.objects.filter(is_active=True).count(),
                'inactive': User.objects.filter(is_active=False).count(),
            },
            'recent_users': User.objects.order_by('-date_joined')[:5].values('email', 'username', 'role', 'date_joined')
        }
        return Response(stats)