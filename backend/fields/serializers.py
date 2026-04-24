from rest_framework import serializers
from django.utils import timezone
from .models import Field, Observation, FieldImage
from accounts.models import User

class UserBasicSerializer(serializers.ModelSerializer):
    """Simplified user serializer for field assignments"""
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'phone_number', 'location']

class ObservationSerializer(serializers.ModelSerializer):
    """Serializer for field observations"""
    agent_name = serializers.ReadOnlyField(source='agent.username')
    agent_email = serializers.ReadOnlyField(source='agent.email')
    field_name = serializers.ReadOnlyField(source='field.name')
    
    class Meta:
        model = Observation
        fields = [
            'id', 'note', 'stage_at_observation', 'crop_health', 
            'pest_disease_issues', 'weather_conditions', 'photos',
            'created_at', 'updated_at', 'agent_name', 'agent_email',
            'field_name'
        ]
        read_only_fields = ['agent', 'created_at', 'updated_at']

class FieldImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldImage
        fields = ['id', 'image', 'image_url', 'document', 'caption', 'file_type', 'uploaded_at']

class FieldSerializer(serializers.ModelSerializer):
    """Main serializer for fields with nested relationships"""
    assigned_to_details = UserBasicSerializer(source='assigned_to', read_only=True)
    created_by_details = UserBasicSerializer(source='created_by', read_only=True)
    status = serializers.ReadOnlyField()
    days_since_planting = serializers.ReadOnlyField()
    expected_harvest_date = serializers.ReadOnlyField()
    observations = ObservationSerializer(many=True, read_only=True)
    
    # For writing (accept ID instead of full object)
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='agent'),
        required=False,
        allow_null=True,
        help_text="Assign to agent by ID"
    )
    
    class Meta:
        model = Field
        fields = [
            'id', 'name', 'crop_type', 'planting_date', 'current_stage',
            'field_size', 'location', 'soil_type', 'notes',
            'assigned_to', 'assigned_to_details', 'created_by', 'created_by_details',
            'status', 'days_since_planting', 'expected_harvest_date',
            'observations', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_planting_date(self, value):
        """Validate planting date is not in the future"""
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Planting date cannot be in the future.")
        return value
    
    def validate_field_size(self, value):
        """Validate field size is positive"""
        if value and value <= 0:
            raise serializers.ValidationError("Field size must be greater than 0.")
        return value
    
    def create(self, validated_data):
        """Create field with automatic created_by set"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class FieldListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views (better performance)"""
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    status = serializers.ReadOnlyField()
    
    class Meta:
        model = Field
        fields = [
            'id', 'name', 'crop_type', 'planting_date', 'current_stage',
            'assigned_to_name', 'status', 'updated_at'
        ]

from rest_framework import serializers
from .models import Field, Observation

class FieldSerializer(serializers.ModelSerializer):
    planting_date = serializers.DateField(format='%Y-%m-%d', required=False, allow_null=True)
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    updated_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = Field
        fields = '__all__'