from rest_framework import permissions
from .models import Field, Observation  # Add this line

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow:
    - Admins: full access (CRUD)
    - Others: read-only access
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to admins
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrAssignedAgent(permissions.BasePermission):
    """
    Custom permission to allow:
    - Admins: full access to all fields
    - Agents: access only to fields assigned to them
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check object-level permissions"""
        # Admin can access any field
        if request.user.role == 'admin':
            return True
        
        # Agent can only access fields assigned to them
        if isinstance(obj, Field):
            return obj.assigned_to == request.user
        
        # For observations, check if agent owns the field
        if isinstance(obj, Observation):
            return obj.field.assigned_to == request.user or request.user.role == 'admin'
        
        return False


class CanAddObservation(permissions.BasePermission):
    """Permission to allow agents to add observations to assigned fields"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins can add observations to any field
        if request.user.role == 'admin':
            return True
        
        # Agents can add observations
        if request.user.role == 'agent':
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # When adding observation, check field assignment
        if request.method == 'POST':
            field_id = request.data.get('field')
            if field_id:
                try:
                    field = Field.objects.get(id=field_id)
                    return field.assigned_to == request.user or request.user.role == 'admin'
                except Field.DoesNotExist:
                    return False
        return True