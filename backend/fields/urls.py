from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FieldViewSet, ObservationViewSet, DashboardStatsView, RecentFieldsView,
    AssignFieldView, UnassignFieldView, AvailableAgentsView, AgentFieldsView,
    MyAssignedFieldsView, ExportFieldsCSVView, ExportObservationsCSVView
)

router = DefaultRouter()
router.register(r'fields', FieldViewSet, basename='field')
router.register(r'observations', ObservationViewSet, basename='observation')

urlpatterns = [
    path('', include(router.urls)),
    
    # Dashboard
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/recent-fields/', RecentFieldsView.as_view(), name='recent-fields'),
    
    # Field Assignments (CRITICAL - These were missing!)
    path('fields/assign/<int:field_id>/', AssignFieldView.as_view(), name='assign-field'),
    path('fields/unassign/<int:field_id>/', UnassignFieldView.as_view(), name='unassign-field'),
    path('agents/', AvailableAgentsView.as_view(), name='available-agents'),
    path('agents/<int:agent_id>/fields/', AgentFieldsView.as_view(), name='agent-fields'),
    path('my-fields/', MyAssignedFieldsView.as_view(), name='my-assigned-fields'),
    
    # Export
    path('export/fields/csv/', ExportFieldsCSVView.as_view(), name='export-fields-csv'),
    path('export/observations/csv/', ExportObservationsCSVView.as_view(), name='export-observations-csv'),
]