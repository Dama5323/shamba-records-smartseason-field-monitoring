from django.urls import path
from .views import (
    CreateAdminUserView,
    GoogleLoginView,
    LoginView, 
    RegisterView, 
    VerifyEmailView, 
    ResendVerificationEmailView,
    UserProfileView, 
    UserProfileUpdateView, 
    ChangePasswordView,
    ListUsersView,
    UserDetailView,
    ToggleUserStatusView,
    UserStatsView,
)

from .social_auth import GoogleSocialAuth, FacebookSocialAuth

urlpatterns = [
    # Authentication
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/<uidb64>/<token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification'),
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),  # Custom Google login
    
    # Social Authentication
    path('social/google/', GoogleSocialAuth.as_view(), name='google_auth'),
    path('social/facebook/', FacebookSocialAuth.as_view(), name='facebook_auth'),
    
    # User Profile (All authenticated users)
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/update/', UserProfileUpdateView.as_view(), name='user_profile_update'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Admin Only Endpoints
    path('stats/', UserStatsView.as_view(), name='user_stats'),
    path('users/', ListUsersView.as_view(), name='list_users'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user_detail'),
    path('users/<int:user_id>/toggle-status/', ToggleUserStatusView.as_view(), name='toggle_user_status'),
    path('admin/create/', CreateAdminUserView.as_view(), name='create-admin'),
]