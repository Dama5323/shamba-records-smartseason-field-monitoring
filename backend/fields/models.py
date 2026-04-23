from django.db import models
from django.conf import settings
from datetime import date
from django.utils import timezone
from django.core.validators import RegexValidator, FileExtensionValidator


class Field(models.Model):
    """
    Field model representing agricultural field/crop.
    """
    STAGE_CHOICES = (
        ('planted', 'Planted'),
        ('growing', 'Growing'),
        ('ready', 'Ready'),
        ('harvested', 'Harvested'),
    )
    
    # Basic field information
    name = models.CharField(max_length=100, help_text="Name of the field or crop block")
    crop_type = models.CharField(max_length=100, help_text="Type of crop (e.g., Maize, Wheat, Rice)")
    planting_date = models.DateField(
        help_text="Date when crop was planted",
        null=True,
        blank=True
    )
    current_stage = models.CharField(
        max_length=20, 
        choices=STAGE_CHOICES, 
        default='planted',
        help_text="Current growth stage of the crop"
    )
    
    # Additional field details
    field_size = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Field size in acres/hectares"
    )
    location = models.CharField(max_length=255, blank=True, null=True)
    soil_type = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Assignment and ownership
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_fields'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_fields'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.crop_type}"
    
    @property
    def status(self):
        """Compute field status based on planting date and current stage."""
        if self.current_stage == 'harvested':
            return 'Completed'
        
        if self.planting_date:
            days_since_planting = (date.today() - self.planting_date).days
            if days_since_planting > 90:
                return 'At Risk'
        
        return 'Active'
    
    @property
    def days_since_planting(self):
        """Calculate days since planting."""
        if self.planting_date:
            return (date.today() - self.planting_date).days
        return 0


class Observation(models.Model):
    """
    Observation model for field notes and stage updates by agents.
    """
    HEALTH_CHOICES = (
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    )
    
    field = models.ForeignKey(
        Field, 
        on_delete=models.CASCADE, 
        related_name='observations'
    )
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='observations'
    )
    
    # Observation content
    note = models.TextField()
    stage_at_observation = models.CharField(
        max_length=20, 
        choices=Field.STAGE_CHOICES, 
        blank=True, 
        null=True
    )
    
    # Optional fields
    crop_health = models.CharField(
        max_length=20,
        choices=HEALTH_CHOICES,
        blank=True,
        null=True
    )
    pest_disease_issues = models.TextField(blank=True, null=True)
    weather_conditions = models.CharField(max_length=100, blank=True, null=True)
    photos = models.JSONField(default=list, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Observation for {self.field.name} on {self.created_at.strftime('%Y-%m-%d')}"
    
    def save(self, *args, **kwargs):
        """Auto-set stage_at_observation if not provided."""
        if not self.stage_at_observation:
            self.stage_at_observation = self.field.current_stage
        super().save(*args, **kwargs)


class FieldImage(models.Model):
    """
    Model for storing field images and documents.
    """
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='images')
    
    # File upload with validation
    image = models.ImageField(
        upload_to='field_images/%Y/%m/%d/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'gif', 'webp'])],
        help_text="Upload field image (JPG, PNG, GIF, WEBP)"
    )
    
    # For external images or documents
    image_url = models.URLField(
        blank=True, 
        null=True, 
        help_text="Or provide external image URL"
    )
    
    # Document upload (PDF, CSV, etc.)
    document = models.FileField(
        upload_to='field_documents/%Y/%m/%d/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['pdf', 'csv', 'xlsx', 'doc', 'docx'])],
        help_text="Upload document (PDF, CSV, Excel, Word)"
    )
    
    caption = models.CharField(max_length=255, blank=True, null=True, help_text="Description of the image/document")
    file_type = models.CharField(
        max_length=20,
        choices=(
            ('image', 'Image'),
            ('document', 'Document'),
            ('map', 'Map/Sketch'),
            ('report', 'Report'),
        ),
        default='image',
        help_text="Type of file"
    )
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='uploaded_images'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.file_type} for {self.field.name} - {self.uploaded_at.strftime('%Y-%m-%d')}"
    
    def file_preview(self):
        """Return HTML preview of the file"""
        if self.image:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 100px;" />', self.image.url)
        elif self.document:
            file_icon = '📄' if self.document.name.endswith('.pdf') else '📊' if self.document.name.endswith(('.csv', '.xlsx')) else '📁'
            return format_html('{} {}', file_icon, self.document.name.split('/')[-1])
        elif self.image_url:
            return format_html('<a href="{}" target="_blank">View Image</a>', self.image_url)
        return 'No file'
    file_preview.short_description = 'Preview'