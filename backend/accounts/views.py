from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_str
from django.contrib.auth import update_session_auth_hash
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
import django.db.models as models  # Add this for Q objects

from .serializers import UserSerializer
from .email_utils import send_verification_email, send_welcome_email
from .models import User
import time
from rest_framework.permissions import IsAuthenticated



class RegisterView(APIView):
    permission_classes = []
    
    def post(self, request):
        print("=== REGISTRATION ATTEMPT ===")
        
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')
        role = request.data.get('role', 'agent')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        phone_number = request.data.get('phone_number', '')
        location = request.data.get('location', '')
        farm_name = request.data.get('farm_name', '')
        
        # Debug logging
        print(f"Email: {email}")
        print(f"Username: {username}")
        print(f"Role provided: {role}")
        
        # CRITICAL: Prevent admin registration
        if role == 'admin':
            return Response({
                'error': 'Admin accounts cannot be created through registration.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Force role to agent
        role = 'agent'
        
        # Validation
        if not email or not username or not password:
            return Response({
                'error': 'Email, username, and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not email.endswith('@gmail.com'):
            return Response({'error': 'Only Gmail accounts are allowed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create user
            user = User(
                email=email,
                username=username,
                role=role,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                location=location,
                farm_name=farm_name
            )
            user.set_password(password)
            user.is_active = True
            user.is_email_verified = True
            user.save()
            
            print(f"✅ User created: {user.email} (ID: {user.id})")
            
            return Response({
                'message': 'Registration successful! You can now login.',
                'email': user.email,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'role': user.role
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error creating user: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Database error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyEmailView(APIView):
    permission_classes = []
    
    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        
        if user and default_token_generator.check_token(user, token):
            user.is_email_verified = True
            user.is_active = True
            user.save()
            
            return Response({
                'message': 'Email verified successfully! You can now login.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid or expired verification link.'
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = []
    
    @extend_schema(
        summary="Login user",
        description="Authenticate user with email and password. Returns JWT tokens.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email', 'example': 'user@gmail.com'},
                    'password': {'type': 'string', 'format': 'password', 'example': 'SecurePass123'},
                },
                'required': ['email', 'password']
            }
        },
        responses={
            200: OpenApiResponse(description="Login successful"),
            401: OpenApiResponse(description="Invalid credentials"),
            403: OpenApiResponse(description="Email not verified"),
        },
        tags=["Authentication"]
    )
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email.endswith('@gmail.com'):
            return Response({'error': 'Only Gmail accounts are allowed'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        user = authenticate(request, username=email, password=password)
        
        if user:
            if not user.is_email_verified:
                return Response({
                    'error': 'Please verify your email before logging in.'
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
    """Resend verification email to user"""
    permission_classes = []
    
    @extend_schema(
        summary="Resend verification email",
        description="Resend email verification link to user",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email'},
                },
                'required': ['email']
            }
        },
        tags=["Authentication"]
    )
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response(
                    {'error': 'Email already verified'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            send_verification_email(user, request)
            return Response({
                'message': 'Verification email sent. Please check your inbox.'
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )


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
            'recent_users': list(User.objects.order_by('-date_joined')[:5].values('email', 'username', 'role', 'date_joined'))
        }
        return Response(stats)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Get user profile",
        description="Get current authenticated user's profile information",
        tags=["Authentication"]
    )
    def get(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Update user profile",
        description="Update current user's profile information",
        request=UserSerializer,
        tags=["Authentication"]
    )
    def put(self, request):
        """Update user profile"""
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Change password",
        description="Change user's password",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'old_password': {'type': 'string'},
                    'new_password': {'type': 'string', 'minLength': 8},
                },
                'required': ['old_password', 'new_password']
            }
        },
        tags=["Authentication"]
    )
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response(
                {'error': 'Both old and new passwords are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Wrong password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)
        
        return Response({'message': 'Password updated successfully'})


class ListUsersView(APIView):
    """List all users - Admin only"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="List all users (Admin only)",
        description="Get paginated list of all users with filtering options",
        parameters=[
            OpenApiParameter(name='role', description='Filter by role', required=False, type=str),
            OpenApiParameter(name='is_active', description='Filter by active status', required=False, type=bool),
            OpenApiParameter(name='search', description='Search by email or username', required=False, type=str),
        ],
        tags=["Admin"]
    )
    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        users = User.objects.all()
        
        # Filter by role
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
        
        # Filter by active status
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            users = users.filter(is_active=is_active.lower() == 'true')
        
        # Search
        search = request.query_params.get('search')
        if search:
            users = users.filter(
                models.Q(email__icontains=search) | 
                models.Q(username__icontains=search)
            )
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total = users.count()
        paginated_users = users[start:end]
        
        serializer = UserSerializer(paginated_users, many=True)
        
        return Response({
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'results': serializer.data
        })


class UserDetailView(APIView):
    """Get, update, or delete a specific user - Admin only"""
    permission_classes = [IsAuthenticated]
    
    def get_user(self, user_id):
        return get_object_or_404(User, id=user_id)
    
    @extend_schema(
        summary="Get user details (Admin only)",
        description="Get detailed information about a specific user",
        tags=["Admin"]
    )
    def get(self, request, user_id):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_user(user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Update user (Admin only)",
        description="Update user information including role, status, etc.",
        request=UserSerializer,
        tags=["Admin"]
    )
    def put(self, request, user_id):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_user(user_id)
        
        # Prevent changing own role
        if 'role' in request.data and user.id == request.user.id:
            return Response(
                {'error': 'You cannot change your own role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Delete user (Admin only)",
        description="Soft delete or permanently delete a user",
        tags=["Admin"]
    )
    def delete(self, request, user_id):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_user(user_id)
        
        # Prevent deleting yourself
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        permanent = request.query_params.get('permanent', 'false').lower() == 'true'
        
        if permanent:
            user.delete()
            message = 'User permanently deleted'
        else:
            user.is_active = False
            user.save()
            message = 'User deactivated'
        
        return Response({'message': message})


class ToggleUserStatusView(APIView):
    """Activate or deactivate a user - Admin only"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Toggle user status (Admin only)",
        description="Activate or deactivate a user account",
        tags=["Admin"]
    )
    def post(self, request, user_id):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = get_object_or_404(User, id=user_id)
        
        # Prevent changing own status
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot change your own status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = not user.is_active
        user.save()
        
        status_text = 'activated' if user.is_active else 'deactivated'
        return Response({
            'message': f'User {status_text} successfully',
            'is_active': user.is_active,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role
            }
        })


class CreateAdminUserView(APIView):
    """Only existing admins can create new admin users"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Create admin user (Admin only)",
        description="Create a new admin user. Only existing admins can create new admin accounts.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email'},
                    'username': {'type': 'string'},
                    'password': {'type': 'string', 'minLength': 8},
                },
                'required': ['email', 'username', 'password']
            }
        },
        tags=["Admin"]
    )
    def post(self, request):
        # Check if current user is admin
        if request.user.role != 'admin':
            return Response({
                'error': 'Only existing administrators can create new admin accounts'
            }, status=status.HTTP_403_FORBIDDEN)
        
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Validation
        if not email or not username or not password:
            return Response({
                'error': 'Email, username, and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check Gmail restriction
        if not email.endswith('@gmail.com'):
            return Response({
                'error': 'Only Gmail accounts are allowed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create admin user
        admin_user = User(
            email=email,
            username=username,
            role='admin',
            is_active=True,
            is_email_verified=True,
            is_staff=True  # Gives Django admin access
        )
        admin_user.set_password(password)
        admin_user.save()
        
        return Response({
            'message': 'Admin user created successfully',
            'user': {
                'id': admin_user.id,
                'email': admin_user.email,
                'username': admin_user.username,
                'role': admin_user.role
            }
        }, status=status.HTTP_201_CREATED)