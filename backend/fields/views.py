from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import date, timedelta
import csv
from django.http import HttpResponse

from accounts.models import User
from .models import Field, Observation, FieldImage
from .serializers import (
    FieldSerializer, FieldListSerializer, ObservationSerializer,
    FieldImageSerializer, UserBasicSerializer
)
from .permissions import IsAdminOrAssignedAgent, CanAddObservation
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes


# ==================== FIELD VIEWSET ====================

@extend_schema_view(
    list=extend_schema(
        summary="List fields",
        description="Returns list of fields. Admin sees all fields, agents see only assigned fields.",
        responses={200: FieldSerializer(many=True)},
        tags=["Fields"]
    ),
    create=extend_schema(
        summary="Create field",
        description="Create a new field. Admin only.",
        request=FieldSerializer,
        responses={201: FieldSerializer, 403: "Forbidden"},
        tags=["Fields"]
    ),
    retrieve=extend_schema(
        summary="Get field details",
        description="Get detailed information about a specific field.",
        tags=["Fields"]
    ),
    update=extend_schema(
        summary="Update field",
        description="Update field information. Admin only.",
        tags=["Fields"]
    ),
    partial_update=extend_schema(
        summary="Partial update field",
        description="Partially update field information. Admin only.",
        tags=["Fields"]
    ),
    destroy=extend_schema(
        summary="Delete field",
        description="Delete a field. Admin only.",
        tags=["Fields"]
    ),
)
class FieldViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing fields.
    Provides CRUD operations plus additional actions for observations and stats.
    """
    serializer_class = FieldSerializer
    permission_classes = [IsAuthenticated, IsAdminOrAssignedAgent]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'crop_type', 'location']
    ordering_fields = ['created_at', 'planting_date', 'current_stage', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return fields based on user role"""
        user = self.request.user
        
        if user.role == 'admin':
            return Field.objects.all().prefetch_related('observations', 'assigned_to')
        else:
            return Field.objects.filter(assigned_to=user).prefetch_related('observations')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FieldListSerializer
        return FieldSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @extend_schema(
        summary="Add observation to field",
        description="Add a new observation to a field. Agents can update field stage.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'note': {'type': 'string', 'example': 'Crop looking healthy.'},
                    'current_stage': {'type': 'string', 'enum': ['planted', 'growing', 'ready', 'harvested']},
                    'crop_health': {'type': 'string', 'enum': ['excellent', 'good', 'fair', 'poor']},
                },
                'required': ['note']
            }
        },
        responses={201: OpenApiResponse(description="Observation added")},
        tags=["Observations"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAddObservation])
    def add_observation(self, request, pk=None):
        field = self.get_object()
        note = request.data.get('note')
        new_stage = request.data.get('current_stage')
        crop_health = request.data.get('crop_health')
        pest_disease_issues = request.data.get('pest_disease_issues')
        weather_conditions = request.data.get('weather_conditions')
        
        if not note:
            return Response({'error': 'Note is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        observation = Observation.objects.create(
            field=field,
            agent=request.user,
            note=note,
            stage_at_observation=field.current_stage,
            crop_health=crop_health,
            pest_disease_issues=pest_disease_issues,
            weather_conditions=weather_conditions
        )
        
        stage_updated = False
        if new_stage and new_stage != field.current_stage:
            valid_stages = ['planted', 'growing', 'ready', 'harvested']
            if new_stage in valid_stages:
                field.current_stage = new_stage
                field.save()
                stage_updated = True
        
        response_data = ObservationSerializer(observation).data
        response_data['stage_updated'] = stage_updated
        if stage_updated:
            response_data['new_stage'] = new_stage
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def observations(self, request, pk=None):
        field = self.get_object()
        observations = field.observations.all()
        serializer = ObservationSerializer(observations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_fields(self, request):
        if request.user.role == 'agent':
            fields = Field.objects.filter(assigned_to=request.user)
        else:
            fields = Field.objects.all()
        serializer = FieldListSerializer(fields, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        user = request.user
        if user.role == 'admin':
            fields = Field.objects.all()
        else:
            fields = Field.objects.filter(assigned_to=user)
        
        total_fields = fields.count()
        at_risk_fields = sum(1 for field in fields if field.status == 'At Risk')
        
        return Response({
            'total_fields': total_fields,
            'active_fields': fields.filter(current_stage__in=['planted', 'growing', 'ready']).count(),
            'completed_fields': fields.filter(current_stage='harvested').count(),
            'at_risk_fields': at_risk_fields,
            'stage_breakdown': {
                'planted': fields.filter(current_stage='planted').count(),
                'growing': fields.filter(current_stage='growing').count(),
                'ready': fields.filter(current_stage='ready').count(),
                'harvested': fields.filter(current_stage='harvested').count(),
            },
        })
    
    @action(detail=False, methods=['get'])
    def at_risk(self, request):
        user = request.user
        if user.role == 'admin':
            fields = Field.objects.all()
        else:
            fields = Field.objects.filter(assigned_to=user)
        
        at_risk_fields = [field for field in fields if field.status == 'At Risk']
        serializer = FieldListSerializer(at_risk_fields, many=True)
        return Response(serializer.data)


# ==================== OBSERVATION VIEWSET ====================

class ObservationViewSet(viewsets.ModelViewSet):  
    serializer_class = ObservationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Observation.objects.all().select_related('field', 'agent')
        return Observation.objects.filter(field__assigned_to=user).select_related('field', 'agent')
    
    def perform_update(self, serializer):
        """Allow agents to update their own observations"""
        if self.request.user.role == 'admin' or serializer.instance.agent == self.request.user:
            serializer.save()
        else:
            raise PermissionError("You can only update your own observations")
    
    def perform_destroy(self, instance):
        """Allow agents to delete their own observations"""
        if self.request.user.role == 'admin' or instance.agent == self.request.user:
            instance.delete()
        else:
            raise PermissionError("You can only delete your own observations")


# ==================== DASHBOARD VIEWS ====================

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role == 'admin':
            return self.get_admin_stats(user)
        return self.get_agent_stats(user)
    
    def get_admin_stats(self, user):
        fields = Field.objects.all()
        status_breakdown = {'Active': 0, 'At Risk': 0, 'Completed': 0}
        for field in fields:
            status_breakdown[field.status] += 1
        
        return Response({
            'role': 'admin',
            'summary': {
                'total_fields': fields.count(),
                'total_agents': User.objects.filter(role='agent').count(),
                'active_fields': status_breakdown['Active'],
                'at_risk_fields': status_breakdown['At Risk'],
                'completed_fields': status_breakdown['Completed']
            },
            'status_breakdown': status_breakdown,
        })
    
    def get_agent_stats(self, user):
        fields = Field.objects.filter(assigned_to=user)
        status_breakdown = {'Active': 0, 'At Risk': 0, 'Completed': 0}
        for field in fields:
            status_breakdown[field.status] += 1
        
        return Response({
            'role': 'agent',
            'summary': {
                'total_fields': fields.count(),
                'active_fields': status_breakdown['Active'],
                'at_risk_fields': status_breakdown['At Risk'],
                'completed_fields': status_breakdown['Completed'],
                'my_observations': Observation.objects.filter(agent=user).count(),
            },
            'status_breakdown': status_breakdown,
        })


class RecentFieldsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role == 'admin':
            fields = Field.objects.all().order_by('-updated_at')[:10]
        else:
            fields = Field.objects.filter(assigned_to=user).order_by('-updated_at')[:10]
        
        data = [{
            'id': f.id,
            'name': f.name,
            'crop_type': f.crop_type,
            'current_stage': f.current_stage,
            'status': f.status,
            'updated_at': f.updated_at.strftime('%Y-%m-%d %H:%M'),
            'assigned_to': f.assigned_to.email if f.assigned_to else 'Unassigned'
        } for f in fields]
        
        return Response(data)


# ==================== FIELD ASSIGNMENT VIEWS (CRITICAL - WAS MISSING) ====================

class AssignFieldView(APIView):
    """Assign a field to an agent - Admin only"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Assign field to agent",
        description="Assign a specific field to a field agent. Admin only.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'agent_id': {'type': 'integer', 'example': 5},
                },
                'required': ['agent_id']
            }
        },
        tags=["Field Assignments"]
    )
    def post(self, request, field_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        field = get_object_or_404(Field, id=field_id)
        agent_id = request.data.get('agent_id')
        
        if not agent_id:
            return Response({'error': 'agent_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        agent = get_object_or_404(User, id=agent_id, role='agent')
        previous_agent = field.assigned_to
        field.assigned_to = agent
        field.save()
        
        return Response({
            'message': f'Field "{field.name}" assigned to {agent.email}',
            'field': FieldSerializer(field).data,
            'previous_agent': previous_agent.email if previous_agent else None
        })


class UnassignFieldView(APIView):
    """Remove assignment from a field - Admin only"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Unassign field",
        description="Remove agent assignment from a field. Admin only.",
        tags=["Field Assignments"]
    )
    def post(self, request, field_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        field = get_object_or_404(Field, id=field_id)
        
        if not field.assigned_to:
            return Response({'error': 'Field is not assigned to any agent'}, status=status.HTTP_400_BAD_REQUEST)
        
        previous_agent = field.assigned_to
        field.assigned_to = None
        field.save()
        
        return Response({
            'message': f'Field "{field.name}" unassigned from {previous_agent.email}',
            'field': FieldSerializer(field).data
        })


class AvailableAgentsView(APIView):
    """List all available field agents - Admin only"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="List available agents",
        description="Get list of all field agents with their assigned fields count. Admin only.",
        tags=["Field Assignments"]
    )
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        agents = User.objects.filter(role='agent', is_active=True)
        agents_data = []
        for agent in agents:
            agents_data.append({
                'id': agent.id,
                'email': agent.email,
                'username': agent.username,
                'phone_number': agent.phone_number,
                'location': agent.location,
                'farm_name': agent.farm_name,
                'assigned_fields_count': Field.objects.filter(assigned_to=agent).count(),
                'last_active': agent.last_login
            })
        
        return Response({
            'total_agents': len(agents_data),
            'agents': agents_data
        })


class MyAssignedFieldsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Debug
        print(f"User: {request.user.email}")
        print(f"User role: '{request.user.role}'")
        print(f"User role type: {type(request.user.role)}")
        print(f"Is agent? {request.user.role == 'agent'}")
        
        if request.user.role != 'agent':
            return Response({
                'error': f'This endpoint is for field agents only. Your role is: {request.user.role}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        fields = Field.objects.filter(assigned_to=request.user)
        serializer = FieldSerializer(fields, many=True)
        
        return Response({
            'total_fields': fields.count(),
            'fields': serializer.data
        })
    
class AgentFieldsView(APIView):
    """Get all fields assigned to a specific agent - Admin only"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Get agent's fields",
        description="Get all fields assigned to a specific agent.",
        tags=["Field Assignments"]
    )
    def get(self, request, agent_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        agent = get_object_or_404(User, id=agent_id, role='agent')
        fields = Field.objects.filter(assigned_to=agent)
        serializer = FieldSerializer(fields, many=True)
        
        return Response({
            'agent': {
                'id': agent.id,
                'email': agent.email,
                'username': agent.username,
                'phone_number': agent.phone_number,
                'location': agent.location
            },
            'total_fields': fields.count(),
            'fields': serializer.data
        })
    
# ==================== EXPORT VIEWS ====================

class ExportFieldsCSVView(APIView):
    """Export fields to CSV - Admin only"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Export fields to CSV",
        description="Export all fields data to CSV file. Admin only.",
        tags=["Export"]
    )
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="fields_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Name', 'Crop Type', 'Planting Date', 'Stage', 'Status', 'Assigned To', 'Location', 'Field Size'])
        
        for field in Field.objects.all():
            writer.writerow([
                field.id, field.name, field.crop_type, field.planting_date,
                field.current_stage, field.status,
                field.assigned_to.email if field.assigned_to else 'Unassigned',
                field.location or '', field.field_size or ''
            ])
        
        return response


class ExportObservationsCSVView(APIView):
    """Export observations to CSV - Admin only"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Export observations to CSV",
        description="Export all observations data to CSV file. Admin only.",
        tags=["Export"]
    )
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="observations_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Field', 'Agent', 'Note', 'Stage', 'Crop Health', 'Created At'])
        
        for obs in Observation.objects.all().select_related('field', 'agent'):
            writer.writerow([
                obs.id, obs.field.name, obs.agent.username,
                obs.note, obs.stage_at_observation, obs.crop_health, obs.created_at
            ])
        
        return response