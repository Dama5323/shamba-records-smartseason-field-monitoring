from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FieldViewSet, ObservationViewSet, DashboardStatsView, RecentFieldsView

router = DefaultRouter()
router.register(r'fields', FieldViewSet, basename='field')
router.register(r'observations', ObservationViewSet, basename='observation')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/recent-fields/', RecentFieldsView.as_view(), name='recent-fields'),
]