from django.urls import path
from .views import LoginView, RegisterView, VerifyEmailView, ResendVerificationEmailView, UserStatsView
from .social_auth import GoogleSocialAuth, FacebookSocialAuth

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('social/google/', GoogleSocialAuth.as_view(), name='google_auth'),
    path('social/facebook/', FacebookSocialAuth.as_view(), name='facebook_auth'),
    path('verify-email/<uidb64>/<token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification'),
    path('stats/', UserStatsView.as_view(), name='user_stats'), 
]
