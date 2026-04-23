from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from datetime import date, timedelta
from accounts.models import User
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Field, Observation, FieldImage
from .serializers import (
    FieldSerializer, FieldListSerializer, ObservationSerializer,
    FieldImageSerializer
)
from .permissions import IsAdminOrAssignedAgent, CanAddObservation
from accounts.models import User



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
            # Admin sees all fields
            return Field.objects.all().prefetch_related('observations', 'assigned_to')
        else:
            # Agent only sees assigned fields
            return Field.objects.filter(assigned_to=user).prefetch_related('observations')
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return FieldListSerializer
        return FieldSerializer
    
    def perform_create(self, serializer):
        """Auto-set created_by when creating field"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAddObservation])
    def add_observation(self, request, pk=None):
        """
        Add an observation to a field.
        Agents can update stage and add notes.
        """
        field = self.get_object()
        
        # Get data from request
        note = request.data.get('note')
        new_stage = request.data.get('current_stage')
        crop_health = request.data.get('crop_health')
        pest_disease_issues = request.data.get('pest_disease_issues')
        weather_conditions = request.data.get('weather_conditions')
        photos = request.data.get('photos', [])
        
        # Validate required fields
        if not note:
            return Response(
                {'error': 'Note is required for observation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create observation
        observation = Observation.objects.create(
            field=field,
            agent=request.user,
            note=note,
            stage_at_observation=field.current_stage,
            crop_health=crop_health,
            pest_disease_issues=pest_disease_issues,
            weather_conditions=weather_conditions,
            photos=photos
        )
        
        # Update field stage if provided and different
        stage_updated = False
        if new_stage and new_stage != field.current_stage:
            # Validate stage
            valid_stages = ['planted', 'growing', 'ready', 'harvested']
            if new_stage in valid_stages:
                field.current_stage = new_stage
                field.save()
                stage_updated = True
            else:
                return Response(
                    {'error': f'Invalid stage. Choose from: {", ".join(valid_stages)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Return response
        response_data = ObservationSerializer(observation).data
        if stage_updated:
            response_data['stage_updated'] = True
            response_data['new_stage'] = new_stage
        else:
            response_data['stage_updated'] = False
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def observations(self, request, pk=None):
        """Get all observations for a field"""
        field = self.get_object()
        observations = field.observations.all()
        serializer = ObservationSerializer(observations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_fields(self, request):
        """Get fields assigned to the current agent"""
        if request.user.role == 'agent':
            fields = Field.objects.filter(assigned_to=request.user)
        else:
            fields = Field.objects.all()
        
        serializer = FieldListSerializer(fields, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get field statistics for dashboard"""
        user = request.user
        
        if user.role == 'admin':
            fields = Field.objects.all()
        else:
            fields = Field.objects.filter(assigned_to=user)
        
        # Calculate statistics
        total_fields = fields.count()
        active_fields = fields.filter(current_stage__in=['planted', 'growing', 'ready']).count()
        completed_fields = fields.filter(current_stage='harvested').count()
        at_risk_fields = sum(1 for field in fields if field.status == 'At Risk')
        
        # Stage breakdown
        stage_breakdown = {
            'planted': fields.filter(current_stage='planted').count(),
            'growing': fields.filter(current_stage='growing').count(),
            'ready': fields.filter(current_stage='ready').count(),
            'harvested': fields.filter(current_stage='harvested').count(),
        }
        
        # Status breakdown
        status_breakdown = {
            'Active': fields.filter(current_stage__in=['planted', 'growing', 'ready']).count(),
            'At Risk': at_risk_fields,
            'Completed': completed_fields,
        }
        
        # Recent observations
        recent_observations = Observation.objects.filter(
            field__in=fields
        ).order_by('-created_at')[:5]
        
        # Crop type distribution
        crop_distribution = fields.values('crop_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total_fields': total_fields,
            'active_fields': active_fields,
            'completed_fields': completed_fields,
            'at_risk_fields': at_risk_fields,
            'stage_breakdown': stage_breakdown,
            'status_breakdown': status_breakdown,
            'recent_observations': ObservationSerializer(recent_observations, many=True).data,
            'crop_distribution': crop_distribution,
        })
    
    @action(detail=False, methods=['get'])
    def at_risk(self, request):
        """Get all at-risk fields"""
        user = request.user
        
        if user.role == 'admin':
            fields = Field.objects.all()
        else:
            fields = Field.objects.filter(assigned_to=user)
        
        # Filter at-risk fields (not harvested and >90 days)
        at_risk_fields = []
        for field in fields:
            if field.status == 'At Risk':
                at_risk_fields.append(field)
        
        serializer = FieldListSerializer(at_risk_fields, many=True)
        return Response(serializer.data)


class ObservationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing observations (read-only)"""
    serializer_class = ObservationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'admin':
            return Observation.objects.all().select_related('field', 'agent')
        else:
            return Observation.objects.filter(field__assigned_to=user).select_related('field', 'agent')



class DashboardStatsView(APIView):
    """
    API endpoint for dashboard statistics.
    Returns different data based on user role.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'admin':
            return self.get_admin_stats(user)
        else:
            return self.get_agent_stats(user)
    
    def get_admin_stats(self, user):
        """Admin sees all fields across all agents"""
        fields = Field.objects.all()
        
        # Basic counts
        total_fields = fields.count()
        total_agents = User.objects.filter(role='agent').count()
        
        # Status breakdown
        status_breakdown = {
            'Active': 0,
            'At Risk': 0,
            'Completed': 0
        }
        
        # Stage breakdown
        stage_breakdown = {
            'planted': fields.filter(current_stage='planted').count(),
            'growing': fields.filter(current_stage='growing').count(),
            'ready': fields.filter(current_stage='ready').count(),
            'harvested': fields.filter(current_stage='harvested').count()
        }
        
        # Calculate statuses
        for field in fields:
            status_breakdown[field.status] += 1
        
        # At-risk fields details
        at_risk_fields = []
        for field in fields:
            if field.status == 'At Risk':
                at_risk_fields.append({
                    'id': field.id,
                    'name': field.name,
                    'crop_type': field.crop_type,
                    'days_since_planting': field.days_since_planting,
                    'assigned_to': field.assigned_to.email if field.assigned_to else 'Unassigned'
                })
        
        # Recent activity (last 7 days)
        week_ago = date.today() - timedelta(days=7)
        recent_observations = Observation.objects.filter(
            created_at__date__gte=week_ago
        ).select_related('field', 'agent')[:10]
        
        recent_activity = []
        for obs in recent_observations:
            recent_activity.append({
                'field_name': obs.field.name,
                'agent_name': obs.agent.username,
                'note': obs.note[:100],
                'created_at': obs.created_at.strftime('%Y-%m-%d %H:%M')
            })
        
        # Agent performance
        agent_performance = []
        agents = User.objects.filter(role='agent')
        for agent in agents:
            assigned_fields = Field.objects.filter(assigned_to=agent).count()
            observations_count = Observation.objects.filter(agent=agent).count()
            
            agent_performance.append({
                'id': agent.id,
                'name': agent.username,
                'email': agent.email,
                'assigned_fields': assigned_fields,
                'observations': observations_count,
                'last_active': agent.last_login.strftime('%Y-%m-%d') if agent.last_login else 'Never'
            })
        
        # Crop distribution
        crop_distribution = []
        crops = fields.values('crop_type').annotate(count=Count('id')).order_by('-count')[:5]
        for crop in crops:
            crop_distribution.append({
                'crop_type': crop['crop_type'],
                'count': crop['count']
            })
        
        # Insights
        insights = self.generate_admin_insights(fields, at_risk_fields, agent_performance)
        
        return Response({
            'role': 'admin',
            'summary': {
                'total_fields': total_fields,
                'total_agents': total_agents,
                'active_fields': status_breakdown['Active'],
                'at_risk_fields': status_breakdown['At Risk'],
                'completed_fields': status_breakdown['Completed']
            },
            'status_breakdown': status_breakdown,
            'stage_breakdown': stage_breakdown,
            'at_risk_fields': at_risk_fields[:5],  # Show top 5
            'recent_activity': recent_activity,
            'agent_performance': agent_performance,
            'crop_distribution': crop_distribution,
            'insights': insights
        })
    
    def get_agent_stats(self, user):
        """Agent sees only their assigned fields"""
        fields = Field.objects.filter(assigned_to=user)
        
        # Basic counts
        total_fields = fields.count()
        
        # Status breakdown
        status_breakdown = {
            'Active': 0,
            'At Risk': 0,
            'Completed': 0
        }
        
        # Stage breakdown
        stage_breakdown = {
            'planted': fields.filter(current_stage='planted').count(),
            'growing': fields.filter(current_stage='growing').count(),
            'ready': fields.filter(current_stage='ready').count(),
            'harvested': fields.filter(current_stage='harvested').count()
        }
        
        # Calculate statuses
        for field in fields:
            status_breakdown[field.status] += 1
        
        # My fields details
        my_fields = []
        for field in fields:
            my_fields.append({
                'id': field.id,
                'name': field.name,
                'crop_type': field.crop_type,
                'current_stage': field.current_stage,
                'status': field.status,
                'days_since_planting': field.days_since_planting,
                'last_observation': self.get_last_observation(field)
            })
        
        # My recent observations
        my_observations = Observation.objects.filter(
            agent=user
        ).select_related('field').order_by('-created_at')[:10]
        
        recent_observations = []
        for obs in my_observations:
            recent_observations.append({
                'id': obs.id,
                'field_name': obs.field.name,
                'note': obs.note[:100],
                'created_at': obs.created_at.strftime('%Y-%m-%d %H:%M')
            })
        
        # Tasks needing attention (at-risk fields)
        pending_tasks = []
        for field in fields:
            if field.status == 'At Risk':
                pending_tasks.append({
                    'id': field.id,
                    'name': field.name,
                    'type': 'At Risk Field',
                    'priority': 'High',
                    'days_overdue': field.days_since_planting - 90
                })
            elif field.current_stage == 'ready':
                pending_tasks.append({
                    'id': field.id,
                    'name': field.name,
                    'type': 'Ready for Harvest',
                    'priority': 'Medium',
                    'days_overdue': 0
                })
        
        # My performance
        total_observations = Observation.objects.filter(agent=user).count()
        fields_with_observations = Observation.objects.filter(agent=user).values('field').distinct().count()
        
        # Insights
        insights = self.generate_agent_insights(fields, pending_tasks, total_observations)
        
        return Response({
            'role': 'agent',
            'summary': {
                'total_fields': total_fields,
                'active_fields': status_breakdown['Active'],
                'at_risk_fields': status_breakdown['At Risk'],
                'completed_fields': status_breakdown['Completed'],
                'my_observations': total_observations,
                'fields_visited': fields_with_observations
            },
            'status_breakdown': status_breakdown,
            'stage_breakdown': stage_breakdown,
            'my_fields': my_fields,
            'recent_observations': recent_observations,
            'pending_tasks': pending_tasks,
            'insights': insights
        })
    
    def get_last_observation(self, field):
        """Get the latest observation for a field"""
        last_obs = field.observations.first()
        if last_obs:
            return {
                'note': last_obs.note[:100],
                'date': last_obs.created_at.strftime('%Y-%m-%d'),
                'agent': last_obs.agent.username
            }
        return None
    
    def generate_admin_insights(self, fields, at_risk_fields, agent_performance):
        """Generate useful insights for admin"""
        insights = []
        
        # Check if there are at-risk fields
        if len(at_risk_fields) > 0:
            insights.append({
                'type': 'warning',
                'message': f'⚠️ {len(at_risk_fields)} field(s) are at risk and need immediate attention.',
                'action': 'View at-risk fields'
            })
        
        # Check completion rate
        total = fields.count()
        completed = fields.filter(current_stage='harvested').count()
        if total > 0:
            completion_rate = (completed / total) * 100
            if completion_rate > 50:
                insights.append({
                    'type': 'success',
                    'message': f'✅ Great progress! {completion_rate:.1f}% of fields have been harvested.',
                    'action': 'View completed fields'
                })
            elif completion_rate < 20 and total > 5:
                insights.append({
                    'type': 'info',
                    'message': f'📈 {completion_rate:.1f}% completion rate. Keep monitoring your fields.',
                    'action': 'View active fields'
                })
        
        # Check agent activity
        inactive_agents = [a for a in agent_performance if a['observations'] == 0]
        if len(inactive_agents) > 0:
            insights.append({
                'type': 'info',
                'message': f'👥 {len(inactive_agents)} agent(s) have not made any observations yet.',
                'action': 'View agents'
            })
        
        # Add seasonal insight
        current_month = date.today().month
        if 3 <= current_month <= 5:
            insights.append({
                'type': 'info',
                'message': '🌱 Spring season - Focus on planting and early growth stages.',
                'action': 'View planting guide'
            })
        elif 6 <= current_month <= 8:
            insights.append({
                'type': 'info',
                'message': '☀️ Summer season - Monitor for pests and ensure adequate irrigation.',
                'action': 'View summer tips'
            })
        
        return insights
    
    def generate_agent_insights(self, fields, pending_tasks, total_observations):
        """Generate useful insights for agent"""
        insights = []
        
        # Pending tasks
        if len(pending_tasks) > 0:
            high_priority = [t for t in pending_tasks if t['priority'] == 'High']
            if len(high_priority) > 0:
                insights.append({
                    'type': 'warning',
                    'message': f'⚠️ You have {len(high_priority)} high-priority task(s) that need immediate attention!',
                    'action': 'View pending tasks'
                })
            else:
                insights.append({
                    'type': 'info',
                    'message': f'📋 You have {len(pending_tasks)} pending task(s) to complete.',
                    'action': 'View tasks'
                })
        
        # Observation streak
        if total_observations > 0:
            insights.append({
                'type': 'success',
                'message': f'🎯 Great job! You\'ve made {total_observations} observation(s) so far.',
                'action': 'View my observations'
            })
        
        # At-risk fields specific to agent
        at_risk_count = len([f for f in fields if f.status == 'At Risk'])
        if at_risk_count > 0:
            insights.append({
                'type': 'warning',
                'message': f'⚠️ {at_risk_count} of your fields are at risk. Please inspect them soon.',
                'action': 'View at-risk fields'
            })
        
        # Completion progress
        total_fields = fields.count()
        completed = fields.filter(current_stage='harvested').count()
        if total_fields > 0 and completed > 0:
            progress = (completed / total_fields) * 100
            insights.append({
                'type': 'info',
                'message': f'📊 You\'ve completed {progress:.0f}% of your assigned fields.',
                'action': 'View progress'
            })
        
        return insights


class RecentFieldsView(APIView):
    """Get recently updated fields"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'admin':
            fields = Field.objects.all().order_by('-updated_at')[:10]
        else:
            fields = Field.objects.filter(assigned_to=user).order_by('-updated_at')[:10]
        
        data = []
        for field in fields:
            data.append({
                'id': field.id,
                'name': field.name,
                'crop_type': field.crop_type,
                'current_stage': field.current_stage,
                'status': field.status,
                'updated_at': field.updated_at.strftime('%Y-%m-%d %H:%M'),
                'assigned_to': field.assigned_to.email if field.assigned_to else 'Unassigned'
            })
        
        return Response(data)
