from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import Field, Observation, FieldImage

@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):
    list_display = ['name', 'crop_type', 'current_stage', 'status_badge', 'planting_date', 'assigned_agent', 'observations_count']
    list_filter = ['current_stage', 'crop_type', 'assigned_to', 'created_at']
    search_fields = ['name', 'crop_type', 'location', 'assigned_to__email']
    readonly_fields = ['status', 'days_since_planting', 'created_at', 'updated_at']
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'crop_type', 'planting_date', 'current_stage', 'field_size', 'location')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Additional Details', {
            'fields': ('soil_type', 'notes'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('status', 'days_since_planting', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status with color coding."""
        if not obj.planting_date:
            return format_html('<span style="color: gray;">⚠️ No planting date</span>')
        
        colors = {
            'Active': '#10B981',
            'At Risk': '#F59E0B',
            'Completed': '#3B82F6'
        }
        icons = {
            'Active': '✅',
            'At Risk': '⚠️',
            'Completed': '🎯'
        }
        status = obj.status
        color = colors.get(status, '#6B7280')
        icon = icons.get(status, '📌')
        return format_html('<span style="color: {}; font-weight: bold;">{} {}</span>', color, icon, status)
    status_badge.short_description = 'Status'
    
    def assigned_agent(self, obj):
        """Display assigned agent."""
        if obj.assigned_to:
            return format_html(
                '<a href="{}" style="color: #3B82F6;">{} ({})</a>',
                reverse('admin:accounts_user_change', args=[obj.assigned_to.id]),
                obj.assigned_to.username,
                obj.assigned_to.email
            )
        return format_html('<span style="color: #9CA3AF;">🔴 Unassigned</span>')
    assigned_agent.short_description = 'Assigned Agent'
    
    def observations_count(self, obj):
        """Display number of observations."""
        count = obj.observations.count()
        url = reverse('admin:fields_observation_changelist') + f'?field__id__exact={obj.id}'
        return format_html('<a href="{}" style="font-weight: bold;">📝 {} observations</a>', url, count)
    observations_count.short_description = 'Observations'
    
    def save_model(self, request, obj, form, change):
        """Auto-set created_by when creating field."""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ['field_link', 'agent_link', 'stage_at_observation', 'crop_health_badge', 'note_preview', 'created_at']
    list_filter = ['crop_health', 'stage_at_observation', 'created_at', 'agent']
    search_fields = ['note', 'field__name', 'agent__email']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    def field_link(self, obj):
        """Link to the field."""
        url = reverse('admin:fields_field_change', args=[obj.field.id])
        return format_html('<a href="{}" style="font-weight: bold;">🌾 {}</a>', url, obj.field.name)
    field_link.short_description = 'Field'
    
    def agent_link(self, obj):
        """Link to the agent."""
        url = reverse('admin:accounts_user_change', args=[obj.agent.id])
        return format_html('<a href="{}">👤 {}</a>', url, obj.agent.username)
    agent_link.short_description = 'Agent'
    
    def crop_health_badge(self, obj):
        """Display crop health with color coding."""
        if not obj.crop_health:
            return '-'
        
        colors = {
            'excellent': '#10B981',
            'good': '#3B82F6',
            'fair': '#F59E0B',
            'poor': '#EF4444'
        }
        color = colors.get(obj.crop_health, '#6B7280')
        return format_html('<span style="color: {}; font-weight: bold;">●</span> {}', color, obj.crop_health.title())
    crop_health_badge.short_description = 'Health'
    
    def note_preview(self, obj):
        """Preview of the note."""
        return obj.note[:100] + '...' if len(obj.note) > 100 else obj.note
    note_preview.short_description = 'Note'


@admin.register(FieldImage)
class FieldImageAdmin(admin.ModelAdmin):
    list_display = ['field_link', 'file_preview', 'file_type', 'caption_preview', 'uploaded_by_link', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at', 'uploaded_by']
    search_fields = ['caption', 'field__name']
    readonly_fields = ['uploaded_at', 'file_preview']
    list_per_page = 25
    
    fieldsets = (
        ('File Information', {
            'fields': ('field', 'file_type', 'caption')
        }),
        ('File Upload', {
            'fields': ('image', 'image_url', 'document'),
            'description': 'You can upload an image file, provide an image URL, or upload a document.'
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'uploaded_at'),
            'classes': ('collapse',)
        }),
    )
    
    def field_link(self, obj):
        """Link to the field."""
        url = reverse('admin:fields_field_change', args=[obj.field.id])
        return format_html('<a href="{}">🌾 {}</a>', url, obj.field.name)
    field_link.short_description = 'Field'
    
    def file_preview(self, obj):
        """Display file preview."""
        if obj.image and obj.image.url:
            return format_html(
                '<img src="{}" style="max-height: 80px; max-width: 120px; border-radius: 4px;" />',
                obj.image.url
            )
        elif obj.document and obj.document.url:
            file_name = obj.document.name.split('/')[-1]
            if obj.document.name.endswith('.pdf'):
                return format_html('<div style="padding: 10px; background: #FEE2E2; border-radius: 4px;">📄 PDF: {}</div>', file_name)
            elif obj.document.name.endswith('.csv'):
                return format_html('<div style="padding: 10px; background: #DBEAFE; border-radius: 4px;">📊 CSV: {}</div>', file_name)
            else:
                return format_html('<div style="padding: 10px; background: #F3F4F6; border-radius: 4px;">📁 Document: {}</div>', file_name)
        elif obj.image_url:
            return format_html('<a href="{}" target="_blank" style="color: #3B82F6;">🔗 View External Image</a>', obj.image_url)
        return format_html('<span style="color: #9CA3AF;">No file uploaded</span>')
    file_preview.short_description = 'Preview'
    
    def caption_preview(self, obj):
        """Preview of caption."""
        return obj.caption[:50] + '...' if obj.caption and len(obj.caption) > 50 else obj.caption or '-'
    caption_preview.short_description = 'Caption'
    
    def uploaded_by_link(self, obj):
        """Link to the uploader."""
        if obj.uploaded_by:
            url = reverse('admin:accounts_user_change', args=[obj.uploaded_by.id])
            return format_html('<a href="{}">👤 {}</a>', url, obj.uploaded_by.username)
        return '-'
    uploaded_by_link.short_description = 'Uploaded By'
    
    def save_model(self, request, obj, form, change):
        """Auto-set uploaded_by when creating."""
        if not change:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)