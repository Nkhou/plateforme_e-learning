from rest_framework import serializers
from .models import (
    CustomUser, QCMAttempt, QCMCompletion, Course, Module, CourseContent, 
    VideoContent, PDFContent, QCM, QCMOption, ContentType, Subscription, 
    Enrollment, TimeTracking, ChatMessage, QCMQuestion, FavoriteCourse
)
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Sum, Avg, Count
from django.shortcuts import get_object_or_404
from django.conf import settings

User = get_user_model()

# Define choices at the module level to avoid duplication
DEPARTMENT_CHOICES = [
    ('F', 'FINANCE'),
    ('H', 'Human RESOURCES'),
    ('M', 'MARKETING'),
    ('O', 'OPERATIONS/PRODUCTION'),
    ('S', 'Sales'),
]

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    privilege_display = serializers.CharField(source='get_privilege_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 
            'first_name', 'last_name', 'full_name',
            'privilege', 'privilege_display', 'department', 'department_display', 
            'status', 'status_display', 'password', 'date_joined', 'last_login'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate_username(self, value):
        if self.instance and CustomUser.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Username already exists")
        elif not self.instance and CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if self.instance and CustomUser.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Email already exists")
        elif not self.instance and CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

# QCM Option Serializer
class QCMOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCMOption
        fields = ['id', 'text', 'is_correct', 'order']

# QCM Option Create Serializer
class QCMOptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCMOption
        fields = ['text', 'is_correct', 'order']

class PDFContentSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='course_content.title', required=False)
    caption = serializers.CharField(source='course_content.caption', required=False)
    order = serializers.IntegerField(source='course_content.order', required=False)
    status = serializers.IntegerField(source='course_content.status', required=False)
    status_display = serializers.CharField(source='course_content.status_display', read_only=True)
    estimated_duration = serializers.IntegerField(source='course_content.estimated_duration', required=False)
    min_required_time = serializers.IntegerField(source='course_content.min_required_time', required=False)
    
    class Meta:
        model = PDFContent
        fields = [
            'id', 'pdf_file', 'page_count', 'estimated_reading_time',
            'title', 'caption', 'order', 'status', 'status_display',
            'estimated_duration', 'min_required_time'
        ]
        read_only_fields = ['id']
    
    def update(self, instance, validated_data):
        # Update course content if provided
        content_data = validated_data.pop('course_content', {})
        if content_data:
            content = instance.course_content
            for attr, value in content_data.items():
                setattr(content, attr, value)
            content.save()
        
        return super().update(instance, validated_data)

class VideoContentSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='course_content.title', required=False)
    caption = serializers.CharField(source='course_content.caption', required=False)
    order = serializers.IntegerField(source='course_content.order', required=False)
    status = serializers.IntegerField(source='course_content.status', required=False)
    status_display = serializers.CharField(source='course_content.status_display', read_only=True)
    estimated_duration = serializers.IntegerField(source='course_content.estimated_duration', required=False)
    min_required_time = serializers.IntegerField(source='course_content.min_required_time', required=False)
    
    class Meta:
        model = VideoContent
        fields = [
            'id', 'video_file', 'duration',
            'title', 'caption', 'order', 'status', 'status_display',
            'estimated_duration', 'min_required_time'
        ]
        read_only_fields = ['id']
    
    def update(self, instance, validated_data):
        # Update course content if provided
        content_data = validated_data.pop('course_content', {})
        if content_data:
            content = instance.course_content
            for attr, value in content_data.items():
                setattr(content, attr, value)
            content.save()
        
        return super().update(instance, validated_data)

# Add these new serializers for the multi-question system
class QCMQuestionSerializer(serializers.ModelSerializer):
    options = QCMOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QCMQuestion
        fields = ['id', 'question', 'question_type', 'points', 'order', 'options']

# FIXED: QCMSerializer with multi-question support
class QCMSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='course_content.title', required=False)
    caption = serializers.CharField(source='course_content.caption', required=False)
    order = serializers.IntegerField(source='course_content.order', required=False)
    status = serializers.IntegerField(source='course_content.status', required=False)
    status_display = serializers.CharField(source='course_content.status_display', read_only=True)
    estimated_duration = serializers.IntegerField(source='course_content.estimated_duration', required=False)
    min_required_time = serializers.IntegerField(source='course_content.min_required_time', required=False)
    
    # Multi-question support - use the actual questions relationship
    questions = QCMQuestionSerializer(many=True, read_only=True)
    
    # Total points calculation
    total_points = serializers.SerializerMethodField()
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = QCM
        fields = [
            'id', 'title', 'caption', 'order', 'status', 'status_display',
            'estimated_duration', 'min_required_time', 
            'passing_score', 'max_attempts', 'time_limit',
            'questions', 'total_points', 'questions_count'
        ]
        read_only_fields = ['id']
    
    def get_total_points(self, obj):
        """Calculate total points from all questions"""
        return sum(question.points for question in obj.questions.all())
    
    def get_questions_count(self, obj):
        """Get number of questions"""
        return obj.questions.count()
    
    def update(self, instance, validated_data):
        content_data = validated_data.pop('course_content', {})
        if content_data:
            content = instance.course_content
            for attr, value in content_data.items():
                setattr(content, attr, value)
            content.save()
        
        return super().update(instance, validated_data)
class ModuleSerializer(serializers.ModelSerializer):
    contents = serializers.SerializerMethodField()
    content_stats = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()  # FIXED: Use SerializerMethodField
    calculated_estimated_duration = serializers.SerializerMethodField()
    calculated_min_required_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order', 'status', 'status_display', 
            'estimated_duration', 'min_required_time', 'created_at', 'updated_at',
            'contents', 'content_stats','estimated_duration', 'min_required_time',
            'calculated_estimated_duration', 'calculated_min_required_time'
        ]
    
    def get_status_display(self, obj):
        """Convert numeric status to French display string"""
        status_map = {
            0: 'Brouillon',
            1: 'Actif', 
            2: 'Archivé'
        }
        return status_map.get(obj.status, 'Non défini')
    
    def get_contents(self, obj):
        if hasattr(obj, 'prefetched_contents'):
            contents = obj.prefetched_contents
        else:
            contents = obj.contents.all().order_by('order')
        
        request = self.context.get('request')
        subscription = self.context.get('subscription')
        
        return CourseContentSerializer(
            contents, 
            many=True, 
            context={'request': request, 'subscription': subscription}
        ).data
    
    def get_content_stats(self, obj):
        if hasattr(obj, 'prefetched_contents'):
            contents = obj.prefetched_contents
        else:
            contents = obj.contents.all()
        
        return {
            'total_contents': len(contents),
            'pdf_count': sum(1 for c in contents if c.content_type.name == 'pdf'),
            'video_count': sum(1 for c in contents if c.content_type.name == 'video'),
            'qcm_count': sum(1 for c in contents if c.content_type.name == 'qcm'),
        }
    def get_calculated_estimated_duration(self, obj):
        """Get calculated duration considering only active content"""
        return obj.calculate_estimated_duration()
    
    def get_calculated_min_required_time(self, obj):
        """Get calculated min required time considering only active content"""
        return obj.calculate_min_required_time()
def safe_int(value, default=0):
    """Safely convert to int, returning default if conversion fails"""
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

def safe_float(value, default=0.0, decimals=2):
    """Safely convert to float, returning default if conversion fails"""
    if value is None:
        return default
    try:
        return round(float(value), decimals)
    except (TypeError, ValueError):
        return default

def safe_percentage(numerator, denominator, decimals=2):
    """Safely calculate percentage, returning 0.0 if denominator is 0"""
    if denominator == 0 or denominator is None or numerator is None:
        return 0.0
    try:
        result = (float(numerator) / float(denominator)) * 100
        return round(result, decimals)
    except (TypeError, ValueError, ZeroDivisionError):
        return 0.0
class ModuleWithContentsSerializer(serializers.ModelSerializer):
    contents = serializers.SerializerMethodField()
    content_stats = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order', 'status', 'status_display',
            'estimated_duration', 'min_required_time', 'created_at', 'updated_at',
            'contents', 'content_stats'
        ]
    
    def get_contents(self, obj):
        contents = obj.contents.all().order_by('order')
        request = self.context.get('request')
        subscription = self.context.get('subscription')
        
        return CourseContentSerializer(
            contents, 
            many=True, 
            context={'request': request, 'subscription': subscription}
        ).data
    
    def get_content_stats(self, obj):
        """Calculate comprehensive content statistics for a module"""
        course = obj.course

        # DEBUG: Check what subscriptions exist 
        all_subscriptions = Subscription.objects.filter(course=course, is_active=True)
        print(f"DEBUG - Course: {course.id}, All active subscriptions: {all_subscriptions.count()}")

        completed_subscriptions = Subscription.objects.filter(
            course=course, 
            is_active=True, 
            is_completed=True
        )
        print(f"DEBUG - Completed subscriptions: {completed_subscriptions.count()}")

        # Print details of each subscription
        for sub in completed_subscriptions:
            print(f"DEBUG - Completed subscription: User {sub.user.id}, Completed: {sub.is_completed}")

        total_enrolled = safe_int(all_subscriptions.count())
        total_completed = safe_int(completed_subscriptions.count())

        print(f"DEBUG - Final counts - Enrolled: {total_enrolled}, Completed: {total_completed}")


        # Calculate completion rate (percentage of enrolled users who completed)
        completion_rate = safe_percentage(total_completed, total_enrolled)

        # Course structure counts
        total_modules = safe_int(Module.objects.filter(course=course).count())
        total_contents_course = safe_int(CourseContent.objects.filter(module__course=course).count())

        # Average progress of all active users
        progress_result = Subscription.objects.filter(
            course=course, 
            is_active=True
        ).aggregate(avg_progress=Avg('progress_percentage'))
        average_progress = safe_float(progress_result.get('avg_progress', 0))

        # Time tracking statistics
        time_result = TimeTracking.objects.filter(course=course).aggregate(
            avg_time=Avg('duration'),
            total_time=Sum('duration')
        )
        avg_time = safe_float(time_result.get('avg_time', 0))
        total_time = safe_int(time_result.get('total_time', 0))

        # Module-specific content counts
        if hasattr(obj, 'prefetched_contents'):
            contents = obj.prefetched_contents
        else:
            contents = obj.contents.all()

        pdf_count = safe_int(contents.filter(content_type__name__iexact='pdf').count())
        video_count = safe_int(contents.filter(content_type__name__iexact='video').count())
        qcm_count = safe_int(contents.filter(content_type__name__iexact='qcm').count())
        total_contents_module = safe_int(contents.count())
        return {
            'total_users_enrolled': total_enrolled,
            'total_users_completed': total_completed,
            'total_modules': total_modules,
            'total_contents_course': total_contents_course,
            'completion_rate': completion_rate,
            'average_progress': average_progress,
            'total_contents_module': total_contents_module,
            'pdf_count': pdf_count,
            'video_count': video_count,
            'qcm_count': qcm_count,
            'average_time_spent': avg_time,
            'total_time_tracked': total_time,
        }
# FIXED: CourseContentSerializer with proper QCM handling
# FIXED: CourseContentSerializer with all required methods
class CourseContentSerializer(serializers.ModelSerializer):
    video_content = VideoContentSerializer(read_only=True)
    pdf_content = PDFContentSerializer(read_only=True)
    qcm = QCMSerializer(read_only=True)
    content_type_name = serializers.CharField(source='content_type.name', read_only=True)
    is_completed = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()  # FIXED: Use SerializerMethodField
    time_spent = serializers.SerializerMethodField()
    last_accessed = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseContent
        fields = [
            'id', 'title', 'caption', 'order', 'status', 'status_display', 
            'content_type_name', 'estimated_duration', 'min_required_time',
            'video_content', 'pdf_content', 'qcm', 'is_completed', 'can_access',
            'time_spent', 'last_accessed', 'created_at', 'updated_at'
        ]
    
    def get_status_display(self, obj):
        """Convert numeric status to French display string"""
        status_map = {
            0: 'Brouillon',
            1: 'Actif', 
            2: 'Archivé'
        }
        return status_map.get(obj.status, 'Non défini')
    
    def get_is_completed(self, obj):
        """Check if the current user has completed this content"""
        request = self.context.get('request')
        subscription = self.context.get('subscription')
        
        if not request or not request.user.is_authenticated:
            return False
        
        if subscription:
            # Check if content is in completed_contents
            if subscription.completed_contents.filter(id=obj.id).exists():
                return True
            
            # For QCM content, check if it's passed
            if obj.content_type.name == 'qcm' and hasattr(obj, 'qcm'):
                qcm_completion = QCMCompletion.objects.filter(
                    subscription=subscription,
                    qcm=obj.qcm,
                    is_passed=True
                ).exists()
                return qcm_completion
        
        return False
    
    def get_can_access(self, obj):
        """Check if user can access this content (based on order)"""
        request = self.context.get('request')
        subscription = self.context.get('subscription')
        
        if not request or not request.user.is_authenticated or not subscription:
            return True  # Allow access for non-subscribed users or preview
            
        # Get all contents in the module ordered by 'order'
        module_contents = CourseContent.objects.filter(
            module=obj.module
        ).order_by('order')
        
        # Find the current content's position
        content_ids = list(module_contents.values_list('id', flat=True))
        current_index = content_ids.index(obj.id) if obj.id in content_ids else -1
        
        # If this is the first content, allow access
        if current_index == 0:
            return True
            
        # Check if previous content is completed
        if current_index > 0:
            previous_content_id = content_ids[current_index - 1]
            previous_content = CourseContent.objects.get(id=previous_content_id)
            
            # Check if previous content is completed
            if previous_content.content_type.name == 'qcm':
                # For QCM, check if it's passed
                if hasattr(previous_content, 'qcm'):
                    qcm_completed = QCMCompletion.objects.filter(
                        subscription=subscription,
                        qcm=previous_content.qcm,
                        is_passed=True
                    ).exists()
                    return qcm_completed
            else:
                # For other content types, check if it's in completed_contents
                return subscription.completed_contents.filter(id=previous_content_id).exists()
        
        return False
    
    def get_time_spent(self, obj):
        """Get time spent on this content by the user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
            
        total_time = TimeTracking.objects.filter(
            user=request.user,
            content=obj
        ).aggregate(total=Sum('duration'))['total']
        
        return total_time or 0
    
    def get_last_accessed(self, obj):
        """Get last accessed time for this content"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
            
        last_tracking = TimeTracking.objects.filter(
            user=request.user,
            content=obj
        ).order_by('-end_time').first()
        
        return last_tracking.end_time if last_tracking else None

class CourseSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    creator_first_name = serializers.CharField(source='creator.first_name', read_only=True)
    creator_last_name = serializers.CharField(source='creator.last_name', read_only=True)
    is_favorited = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()  # FIXED: Use SerializerMethodField
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    calculated_estimated_duration = serializers.SerializerMethodField()
    calculated_min_required_time = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 
            'title_of_course', 
            'description', 
            'image_url', 
            'department', 
            'department_display',
            'status',
            'status_display',
            'created_at',
            'updated_at',
            'estimated_duration',
            'min_required_time',
            'progress_percentage',
            'is_subscribed',
            'is_favorited',
            'creator_username',
            'creator_first_name',
            'creator_last_name',
            'estimated_duration', 'min_required_time',
            'calculated_estimated_duration', 'calculated_min_required_time'
        ]
    
    def get_status_display(self, obj):
        """Convert numeric status to French display string"""
        status_map = {
            0: 'Brouillon',
            1: 'Actif', 
            2: 'Archivé'
        }
        return status_map.get(obj.status, 'Non défini')
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_calculated_estimated_duration(self, obj):
        """Get calculated duration considering only active content"""
        return obj.calculate_estimated_duration()
    
    def get_calculated_min_required_time(self, obj):
        """Get calculated min required time considering only active content"""
        return obj.calculate_min_required_time()
    def get_is_favorited(self, obj):
        """Check if course is favorited by current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return FavoriteCourse.objects.filter(
                user=request.user,
                course=obj
            ).exists()
        return False
    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                subscription = Subscription.objects.filter(
                    user=request.user, 
                    course=obj, 
                    is_active=True
                ).first()

                if subscription:
                    # Use the subscription's progress_percentage field directly
                    # This should be maintained by your completion tracking logic
                    return subscription.progress_percentage

            except Exception as e:
                print(f"Error getting progress for course {obj.id}: {str(e)}")
                return 0.0

        return 0.0

    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Subscription.objects.filter(
                user=request.user, 
                course=obj, 
                is_active=True
            ).exists()
        return False

class CourseDetailSerializer(serializers.ModelSerializer):
    modules = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    creator_first_name = serializers.CharField(source='creator.first_name', read_only=True)
    creator_last_name = serializers.CharField(source='creator.last_name', read_only=True)
    status_display = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    # Add these statistics fields
    estimated_duration_info = serializers.SerializerMethodField()
    avg_progress = serializers.SerializerMethodField()
    your_progress = serializers.SerializerMethodField()
    apprenants_count = serializers.SerializerMethodField()
    course_statistics = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title_of_course', 'description', 'department', 'department_display',
            'status', 'status_display', 'image_url', 'creator_username', 
            'creator_first_name', 'creator_last_name', 'created_at', 'updated_at',
            'estimated_duration', 'min_required_time', 'modules',
            # Add these fields
            'estimated_duration_info', 'avg_progress', 'your_progress', 
            'apprenants_count', 'course_statistics'
        ]
    
    def get_status_display(self, obj):
        """Convert numeric status to French display string"""
        status_map = {
            0: 'Brouillon',
            1: 'Actif', 
            2: 'Archivé'
        }
        return status_map.get(obj.status, 'Non défini')
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"{settings.BASE_URL}{obj.image.url}" if hasattr(settings, 'BASE_URL') else obj.image.url
        return None
    
    def get_modules(self, obj):
        modules = obj.modules.all().order_by('order')
        request = self.context.get('request')
        
        subscription = None
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            subscription = Subscription.objects.filter(
                user=user,
                course=obj,
                is_active=True
            ).first()
        
        return ModuleWithContentsSerializer(
            modules, 
            many=True, 
            context={'request': request, 'subscription': subscription}
        ).data
    
    def get_estimated_duration_info(self, obj):
        """Get course duration information"""
        try:
            calculated_duration = obj.calculate_estimated_duration()
            calculated_min_time = obj.calculate_min_required_time()
            
            return {
                'estimated_duration_minutes': obj.estimated_duration or calculated_duration,
                'estimated_duration_hours': round((obj.estimated_duration or calculated_duration) / 60, 1),
                'min_required_time_minutes': obj.min_required_time or calculated_min_time,
                'min_required_time_hours': round((obj.min_required_time or calculated_min_time) / 60, 1),
                'calculated_duration_minutes': calculated_duration,
                'calculated_min_time_minutes': calculated_min_time
            }
        except Exception as e:
            print(f"Error calculating duration for course {obj.id}: {str(e)}")
            return {
                'estimated_duration_minutes': 0,
                'estimated_duration_hours': 0,
                'min_required_time_minutes': 0,
                'min_required_time_hours': 0,
                'calculated_duration_minutes': 0,
                'calculated_min_time_minutes': 0
            }
    
    def get_avg_progress(self, obj):
        """Get average progress across all subscribers"""
        try:
            active_subscriptions = obj.course_subscriptions.filter(is_active=True)
            if active_subscriptions.exists():
                avg_result = active_subscriptions.aggregate(avg_progress=Avg('progress_percentage'))
                return round(avg_result['avg_progress'] or 0, 2)
            return 0
        except Exception as e:
            print(f"Error calculating avg progress for course {obj.id}: {str(e)}")
            return 0
    
    def get_your_progress(self, obj):
        """Get current user's progress"""
        try:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                subscription = obj.course_subscriptions.filter(
                    user=request.user, 
                    is_active=True
                ).first()
                return subscription.progress_percentage if subscription else 0
            return 0
        except Exception as e:
            print(f"Error calculating user progress for course {obj.id}: {str(e)}")
            return 0
    
    def get_apprenants_count(self, obj):
        """Get number of apprenants subscribed to this course"""
        try:
            return obj.course_subscriptions.filter(
                is_active=True, 
                user__privilege='AP'
            ).count()
        except Exception as e:
            print(f"Error counting apprenants for course {obj.id}: {str(e)}")
            return 0
    
    def get_course_statistics(self, obj):
        """Get comprehensive course statistics"""
        try:
            active_subscriptions = obj.course_subscriptions.filter(is_active=True)
            total_subscribers = active_subscriptions.count()
            
            # Progress statistics
            if total_subscribers > 0:
                total_progress = sum(sub.progress_percentage for sub in active_subscriptions)
                avg_progress = round(total_progress / total_subscribers, 2)
                
                # Count subscribers by progress ranges
                beginner_count = active_subscriptions.filter(progress_percentage__lt=25).count()
                intermediate_count = active_subscriptions.filter(progress_percentage__range=[25, 75]).count()
                advanced_count = active_subscriptions.filter(progress_percentage__gt=75).count()
                completed_count = active_subscriptions.filter(is_completed=True).count()
            else:
                avg_progress = 0
                beginner_count = intermediate_count = advanced_count = completed_count = 0
            
            # User type counts
            apprenants_count = active_subscriptions.filter(user__privilege='AP').count()
            formateurs_count = active_subscriptions.filter(user__privilege='F').count()
            admins_count = active_subscriptions.filter(user__privilege='A').count()
            
            return {
                'total_subscribers': total_subscribers,
                'apprenants_count': apprenants_count,
                'formateurs_count': formateurs_count,
                'admins_count': admins_count,
                'avg_progress': avg_progress,
                'progress_distribution': {
                    'beginner': beginner_count,
                    'intermediate': intermediate_count,
                    'advanced': advanced_count,
                    'completed': completed_count
                },
                'completion_rate': round((completed_count / total_subscribers * 100), 2) if total_subscribers > 0 else 0
            }
            
        except Exception as e:
            print(f"Error getting course statistics for course {obj.id}: {str(e)}")
            return {
                'total_subscribers': 0,
                'apprenants_count': 0,
                'formateurs_count': 0,
                'admins_count': 0,
                'avg_progress': 0,
                'progress_distribution': {
                    'beginner': 0,
                    'intermediate': 0,
                    'advanced': 0,
                    'completed': 0
                },
                'completion_rate': 0
            }

def get_avg_progress(self, obj):
    """Get average progress across all subscribers"""
    try:
        active_subscriptions = obj.course_subscriptions.filter(is_active=True)
        if active_subscriptions.exists():
            avg_result = active_subscriptions.aggregate(avg_progress=Avg('progress_percentage'))
            return round(avg_result['avg_progress'] or 0, 2)
        return 0
    except Exception as e:
        print(f"Error calculating avg progress for course {obj.id}: {str(e)}")
        return 0

def get_your_progress(self, obj):
    """Get current user's progress"""
    try:
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            subscription = obj.course_subscriptions.filter(
                user=request.user, 
                is_active=True
            ).first()
            return subscription.progress_percentage if subscription else 0
        return 0
    except Exception as e:
        print(f"Error calculating user progress for course {obj.id}: {str(e)}")
        return 0

def get_apprenants_count(self, obj):
    """Get number of apprenants subscribed to this course"""
    try:
        return obj.course_subscriptions.filter(
            is_active=True, 
            user__privilege='AP'
        ).count()
    except Exception as e:
        print(f"Error counting apprenants for course {obj.id}: {str(e)}")
        return 0
    
    def get_avg_progress(self, obj):
        """Get average progress across all subscribers"""
        try:
            active_subscriptions = obj.course_subscriptions.filter(is_active=True)
            if active_subscriptions.exists():
                total_progress = sum(sub.progress_percentage for sub in active_subscriptions)
                return round(total_progress / active_subscriptions.count(), 2)
            return 0
        except:
            return 0
    
    def get_your_progress(self, obj):
        """Get current user's progress"""
        try:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                subscription = obj.course_subscriptions.filter(
                    user=request.user, 
                    is_active=True
                ).first()
                return subscription.progress_percentage if subscription else 0
            return 0
        except:
            return 0
    
    def get_apprenants_count(self, obj):
        """Get number of apprenants subscribed to this course"""
        try:
            return obj.course_subscriptions.filter(
                is_active=True, 
                user__privilege='AP'
            ).count()
        except:
            return 0
    
    def get_course_statistics(self, obj):
        """Get comprehensive course statistics"""
        try:
            active_subscriptions = obj.course_subscriptions.filter(is_active=True)
            total_subscribers = active_subscriptions.count()
            
            # Progress statistics
            if total_subscribers > 0:
                total_progress = sum(sub.progress_percentage for sub in active_subscriptions)
                avg_progress = round(total_progress / total_subscribers, 2)
                
                # Count subscribers by progress ranges
                beginner_count = active_subscriptions.filter(progress_percentage__lt=25).count()
                intermediate_count = active_subscriptions.filter(progress_percentage__range=[25, 75]).count()
                advanced_count = active_subscriptions.filter(progress_percentage__gt=75).count()
                completed_count = active_subscriptions.filter(is_completed=True).count()
            else:
                avg_progress = 0
                beginner_count = intermediate_count = advanced_count = completed_count = 0
            
            # User type counts
            apprenants_count = active_subscriptions.filter(user__privilege='AP').count()
            formateurs_count = active_subscriptions.filter(user__privilege='F').count()
            admins_count = active_subscriptions.filter(user__privilege='A').count()
            
            return {
                'total_subscribers': total_subscribers,
                'apprenants_count': apprenants_count,
                'formateurs_count': formateurs_count,
                'admins_count': admins_count,
                'avg_progress': avg_progress,
                'progress_distribution': {
                    'beginner': beginner_count,
                    'intermediate': intermediate_count,
                    'advanced': advanced_count,
                    'completed': completed_count
                },
                'completion_rate': round((completed_count / total_subscribers * 100), 2) if total_subscribers > 0 else 0
            }
            
        except Exception as e:
            print(f"Error getting course statistics for course {obj.id}: {str(e)}")
            return {
                'total_subscribers': 0,
                'apprenants_count': 0,
                'formateurs_count': 0,
                'admins_count': 0,
                'avg_progress': 0,
                'progress_distribution': {
                    'beginner': 0,
                    'intermediate': 0,
                    'advanced': 0,
                    'completed': 0
                },
                'completion_rate': 0
            }

# Course Create Serializer
class CourseCreateSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    creator_first_name = serializers.CharField(source='creator.first_name', read_only=True)
    creator_last_name = serializers.CharField(source='creator.last_name', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'title_of_course', 
            'description', 
            'department',
            'status',
            'image',
            'estimated_duration',
            'min_required_time',
            'creator_username',
            'creator_first_name',
            'creator_last_name'
        ]
        read_only_fields = ['creator']  # Add this line
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            # Set the creator to the current user
            validated_data['creator'] = request.user
            
            # AUTO-SET DEPARTMENT FROM CREATOR'S DEPARTMENT
            if 'department' not in validated_data or not validated_data['department']:
                validated_data['department'] = request.user.department
        else:
            raise serializers.ValidationError("User must be authenticated to create a course")
        
        try:
            print('hello6666666666666666666666666666666666666')
            course = Course.objects.create(**validated_data)
            return course
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create course: {str(e)}")
# QCM Create Serializer
# NEW: Serializer for creating questions with options
class QCMQuestionCreateSerializer(serializers.ModelSerializer):
    options = QCMOptionCreateSerializer(many=True)
    
    class Meta:
        model = QCMQuestion
        fields = ['question', 'question_type', 'points', 'order', 'options']

# # FIXED: QCMContentCreateSerializer with multi-question support
# class QCMContentCreateSerializer(serializers.ModelSerializer):
#     # NEW: Accept multiple questions instead of single question
#     qcm_questions = QCMQuestionCreateSerializer(many=True, required=True)
    
#     # Remove old single-question fields
#     # qcm_question = serializers.CharField(required=False)  # REMOVE THIS
#     # qcm_options = QCMOptionCreateSerializer(many=True, required=False)  # REMOVE THIS
#     # points = serializers.IntegerField(required=False, default=1)  # REMOVE THIS
#     # question_type = serializers.ChoiceField(choices=[('single', 'Single'), ('multiple', 'Multiple')], default='single')  # REMOVE THIS
    
#     title = serializers.CharField(required=True)
#     caption = serializers.CharField(required=False, allow_blank=True)
#     order = serializers.IntegerField(required=True)
#     estimated_duration = serializers.IntegerField(required=False)
#     min_required_time = serializers.IntegerField(required=False)

#     class Meta:
#         model = CourseContent
#         fields = [
#             'title', 'caption', 'order', 'estimated_duration', 'min_required_time',
#             'qcm_questions', 'passing_score', 'max_attempts', 'time_limit'
#         ]
    
#     def validate(self, data):
#         qcm_questions = data.get('qcm_questions', [])
        
#         if not qcm_questions:
#             raise serializers.ValidationError("At least one question is required for QCM content")
        
#         for i, question_data in enumerate(qcm_questions):
#             options = question_data.get('options', [])
#             if len(options) < 2:
#                 raise serializers.ValidationError(f"Question {i+1}: At least 2 options are required")
            
#             correct_options = sum(1 for option in options if option.get('is_correct', False))
#             if correct_options == 0:
#                 raise serializers.ValidationError(f"Question {i+1}: At least one option must be correct")
            
#             # For single choice questions, ensure only one correct option
#             if question_data.get('question_type') == 'single' and correct_options > 1:
#                 raise serializers.ValidationError(f"Question {i+1}: Single choice questions can have only one correct option")
        
#         return data
    
#     def create(self, validated_data):
#         qcm_questions_data = validated_data.pop('qcm_questions')
#         passing_score = validated_data.pop('passing_score', 80)
#         max_attempts = validated_data.pop('max_attempts', 3)
#         time_limit = validated_data.pop('time_limit', 0)
        
#         module = self.context.get('module')
#         content_type = self.context.get('content_type')
        
#         if not module or not content_type:
#             raise serializers.ValidationError("Module and content type are required")
        
#         # Create course content
#         course_content = CourseContent.objects.create(
#             module=module,
#             content_type=content_type,
#             **validated_data
#         )
        
#         # Create QCM
#         qcm = QCM.objects.create(
#             course_content=course_content,
#             passing_score=passing_score,
#             max_attempts=max_attempts,
#             time_limit=time_limit
#         )
        
#         # Create questions and their options
#         for question_data in qcm_questions_data:
#             options_data = question_data.pop('options')
            
#             question = QCMQuestion.objects.create(
#                 qcm=qcm,
#                 **question_data
#             )
            
#             # Create options for this question
#             for option_data in options_data:
#                 QCMOption.objects.create(
#                     question=question,  # Link to question, not QCM
#                     **option_data
#                 )
        
#         return course_content

# PDF Content Create Serializer
class PDFContentCreateSerializer(serializers.ModelSerializer):
    pdf_file = serializers.FileField(required=True)
    title = serializers.CharField(required=True)
    caption = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=True)
    estimated_duration = serializers.IntegerField(required=False)
    min_required_time = serializers.IntegerField(required=False)
    
    class Meta:
        model = CourseContent
        fields = ['title', 'caption', 'order', 'estimated_duration', 'min_required_time', 'pdf_file']
    
    def create(self, validated_data):
        pdf_file = validated_data.pop('pdf_file')
        module = self.context.get('module')
        content_type = self.context.get('content_type')
        
        if not module or not content_type:
            raise serializers.ValidationError("Module and content type are required")
        
        course_content = CourseContent.objects.create(
            module=module,
            content_type=content_type,
            **validated_data
        )
        
        PDFContent.objects.create(course_content=course_content, pdf_file=pdf_file)
        return course_content

# Video Content Create Serializer
class VideoContentCreateSerializer(serializers.ModelSerializer):
    video_file = serializers.FileField(required=True)
    title = serializers.CharField(required=True)
    caption = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=True)
    estimated_duration = serializers.IntegerField(required=False)
    min_required_time = serializers.IntegerField(required=False)
    
    class Meta:
        model = CourseContent
        fields = ['title', 'caption', 'order', 'estimated_duration', 'min_required_time', 'video_file']
    
    def create(self, validated_data):
        video_file = validated_data.pop('video_file')
        module = self.context.get('module')
        content_type = self.context.get('content_type')
        
        if not module or not content_type:
            raise serializers.ValidationError("Module and content type are required")
        
        course_content = CourseContent.objects.create(
            module=module,
            content_type=content_type,
            **validated_data
        )
        
        VideoContent.objects.create(course_content=course_content, video_file=video_file)
        return course_content

# QCM Content Create Serializer
class QCMContentCreateSerializer(serializers.ModelSerializer):
    # Multi-question fields
    questions = QCMQuestionCreateSerializer(many=True, required=True)
    
    # QCM settings
    passing_score = serializers.IntegerField(default=80)
    max_attempts = serializers.IntegerField(default=3)
    time_limit = serializers.IntegerField(default=0)
    
    # Course content fields
    title = serializers.CharField(required=True)
    caption = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=True)
    estimated_duration = serializers.IntegerField(required=False)
    min_required_time = serializers.IntegerField(required=False)

    class Meta:
        model = CourseContent
        fields = [
            'title', 'caption', 'order', 'estimated_duration', 'min_required_time',
            'questions', 'passing_score', 'max_attempts', 'time_limit'
        ]
    
    def validate(self, data):
        questions = data.get('questions', [])
        
        if not questions:
            raise serializers.ValidationError("At least one question is required for QCM content")
        
        for i, question_data in enumerate(questions):
            options = question_data.get('options', [])
            if len(options) < 2:
                raise serializers.ValidationError(f"Question {i+1}: At least 2 options are required")
            
            correct_options = sum(1 for option in options if option.get('is_correct', False))
            if correct_options == 0:
                raise serializers.ValidationError(f"Question {i+1}: At least one option must be correct")
            
            # For single choice questions, ensure only one correct option
            question_type = question_data.get('question_type', 'single')
            if question_type == 'single' and correct_options > 1:
                raise serializers.ValidationError(f"Question {i+1}: Single choice questions can have only one correct option")
        
        return data
    
    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        passing_score = validated_data.pop('passing_score', 80)
        max_attempts = validated_data.pop('max_attempts', 3)
        time_limit = validated_data.pop('time_limit', 0)
        
        module = self.context.get('module')
        content_type = self.context.get('content_type')
        
        if not module or not content_type:
            raise serializers.ValidationError("Module and content type are required")
        
        # Create course content
        course_content = CourseContent.objects.create(
            module=module,
            content_type=content_type,
            **validated_data
        )
        
        # Create QCM
        qcm = QCM.objects.create(
            course_content=course_content,
            passing_score=passing_score,
            max_attempts=max_attempts,
            time_limit=time_limit
        )
        
        # Create questions and their options
        for question_data in questions_data:
            options_data = question_data.pop('options')
            
            question = QCMQuestion.objects.create(
                qcm=qcm,
                **question_data
            )
            
            # Create options for this question
            for option_data in options_data:
                QCMOption.objects.create(
                    question=question,  # Link to question
                    **option_data
                )
        
        return course_content
# Subscriber Serializer
class SubscriberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'department_display', 'privilege']
    
    def get_full_name(self, obj):
        return obj.full_name

# Subscription Serializer
# Update your SubscriptionSerializer in serializers.py
class SubscriptionSerializer(serializers.ModelSerializer):
    user = SubscriberSerializer(read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    total_score = serializers.IntegerField(read_only=True)
    completed_contents_count = serializers.SerializerMethodField()
    total_contents_count = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    total_time_spent = serializers.IntegerField(read_only=True)
    average_time_per_session = serializers.IntegerField(read_only=True)
    can_complete_course = serializers.SerializerMethodField()
    completion_requirements = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'subscribed_at', 'is_active', 'progress_percentage', 
            'total_score', 'completed_contents_count', 'total_contents_count',
            'is_completed', 'total_time_spent', 'average_time_per_session',
            'can_complete_course', 'completion_requirements'
        ]
    
    def get_progress_percentage(self, obj):
        """Calculate progress based only on active content"""
        course = obj.course
        
        # Get active modules and contents
        active_modules = Module.objects.filter(course=course, status=1)
        active_contents = CourseContent.objects.filter(
            module__in=active_modules,
            status=1
        )
        
        # Get completed active contents
        completed_active_contents = obj.completed_contents.filter(
            id__in=active_contents.values_list('id', flat=True)
        )
        
        total_active_contents = active_contents.count()
        completed_count = completed_active_contents.count()
        
        if total_active_contents > 0:
            return round((completed_count / total_active_contents) * 100, 2)
        return 0.0
    
    def get_completed_contents_count(self, obj):
        """Count only completed active contents"""
        course = obj.course
        active_modules = Module.objects.filter(course=course, status=1)
        active_contents = CourseContent.objects.filter(
            module__in=active_modules,
            status=1
        )
        
        completed_active_contents = obj.completed_contents.filter(
            id__in=active_contents.values_list('id', flat=True)
        )
        
        return completed_active_contents.count()
    
    def get_total_contents_count(self, obj):
        """Count only active contents"""
        course = obj.course
        active_modules = Module.objects.filter(course=course, status=1)
        active_contents = CourseContent.objects.filter(
            module__in=active_modules,
            status=1
        )
        
        return active_contents.count()
    
    def get_is_completed(self, obj):
        """Check completion based only on active content"""
        course = obj.course
        
        # Get active modules and contents
        active_modules = Module.objects.filter(course=course, status=1)
        active_contents = CourseContent.objects.filter(
            module__in=active_modules,
            status=1
        )
        
        # Get completed active contents
        completed_active_contents = obj.completed_contents.filter(
            id__in=active_contents.values_list('id', flat=True)
        )
        
        # Calculate time requirements for active content
        total_min_required_time = self.calculate_active_min_required_time(course)
        
        # Check completion criteria
        all_content_completed = completed_active_contents.count() >= active_contents.count()
        time_requirements_met = obj.total_time_spent >= (total_min_required_time * 60)
        
        return all_content_completed and time_requirements_met
    
    def get_can_complete_course(self, obj):
        """Check if user can complete course based on active content time requirements"""
        course = obj.course
        total_min_required_time = self.calculate_active_min_required_time(course)
        return obj.total_time_spent >= (total_min_required_time * 60)
    
    def get_completion_requirements(self, obj):
        """Get completion requirements for active content only"""
        course = obj.course
        
        # Get active modules and contents
        active_modules = Module.objects.filter(course=course, status=1)
        active_contents = CourseContent.objects.filter(
            module__in=active_modules,
            status=1
        )
        
        # Get completed active contents
        completed_active_contents = obj.completed_contents.filter(
            id__in=active_contents.values_list('id', flat=True)
        )
        
        # Calculate time requirements
        total_min_required_time = self.calculate_active_min_required_time(course)
        required_time_seconds = total_min_required_time * 60
        
        all_content_completed = completed_active_contents.count() >= active_contents.count()
        time_requirements_met = obj.total_time_spent >= required_time_seconds
        
        return {
            'contents_met': all_content_completed,
            'time_met': time_requirements_met,
            'required_contents': active_contents.count(),
            'completed_contents': completed_active_contents.count(),
            'required_time_seconds': required_time_seconds,
            'actual_time_seconds': obj.total_time_spent,
            'progress_percentage': self.get_progress_percentage(obj),
            'can_complete': all_content_completed and time_requirements_met
        }
    
    def calculate_active_min_required_time(self, course):
        """Calculate minimum required time for active content only"""
        active_modules = Module.objects.filter(course=course, status=1)
        active_contents = CourseContent.objects.filter(
            module__in=active_modules,
            status=1
        )
        
        total_min_required_time = 0
        
        for content in active_contents:
            if content.min_required_time:
                total_min_required_time += content.min_required_time
            else:
                # Conservative estimates for min required time
                content_type_name = content.content_type.name.lower()
                if content_type_name == 'video':
                    total_min_required_time += 8
                elif content_type_name == 'pdf':
                    total_min_required_time += 12
                elif content_type_name == 'qcm':
                    total_min_required_time += 4
                else:
                    total_min_required_time += 8
        
        return total_min_required_time
# Course with Subscribers Serializer
class CourseWithSubscribersSerializer(serializers.ModelSerializer):
    subscribers = SubscriptionSerializer(many=True, read_only=True, source='course_subscriptions')
    subscribers_count = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'title_of_course', 'description', 'department', 'department_display', 
            'image', 'estimated_duration', 'min_required_time',
            'subscribers_count', 'subscribers', 'created_at'
        ]
    
    def get_subscribers_count(self, obj):
        return obj.course_subscriptions.filter(is_active=True).count()

# QCM Detail Serializer
class QCMDetailSerializer(serializers.ModelSerializer):
    options = QCMOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QCM
        fields = ['id', 'question', 'question_type', 'points', 'passing_score', 'max_attempts', 'time_limit', 'options']

# QCM Attempt Serializer
class QCMAttemptSerializer(serializers.ModelSerializer):
    selected_option_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    
    class Meta:
        model = QCMAttempt
        fields = ['id', 'user', 'qcm', 'selected_option_ids', 'time_taken', 
                 'attempt_number', 'score', 'is_passed', 'completed_at']
        read_only_fields = ['id', 'user', 'qcm', 'score', 'is_passed', 'completed_at']

# QCM Completion Serializer
class QCMCompletionSerializer(serializers.ModelSerializer):
    qcm_title = serializers.CharField(source='qcm.question', read_only=True)
    
    class Meta:
        model = QCMCompletion
        fields = ['qcm', 'qcm_title', 'best_score', 'points_earned', 'is_passed', 'attempts_count', 'last_attempt']

# Course Content Create Serializer (for handling all content types)
# FIXED: CourseContentCreateSerializer with proper QCM handling
class CourseContentCreateSerializer(serializers.ModelSerializer):
    content_type = serializers.CharField(write_only=True)
    pdf_file = serializers.FileField(required=False, allow_null=True)
    video_file = serializers.FileField(required=False, allow_null=True)
    
    # Multi-question QCM fields
    questions = QCMQuestionCreateSerializer(many=True, required=False, allow_null=True)
    passing_score = serializers.IntegerField(required=False, default=80)
    max_attempts = serializers.IntegerField(required=False, default=3)
    time_limit = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = CourseContent
        fields = [
            'title', 'caption', 'order', 'status', 'content_type',
            'estimated_duration', 'min_required_time',
            'pdf_file', 'video_file', 'questions',
            'passing_score', 'max_attempts', 'time_limit'
        ]

    def validate(self, data):
        content_type_name = data.get('content_type')
        
        if content_type_name == 'pdf' and not data.get('pdf_file'):
            raise serializers.ValidationError("PDF file is required for PDF content")
        
        if content_type_name == 'video' and not data.get('video_file'):
            raise serializers.ValidationError("Video file is required for video content")
        
        if content_type_name == 'qcm':
            questions = data.get('questions', [])
            if not questions:
                raise serializers.ValidationError("At least one question is required for QCM content")
            
            # Validate each question
            for i, question_data in enumerate(questions):
                options = question_data.get('options', [])
                if len(options) < 2:
                    raise serializers.ValidationError(f"Question {i+1}: At least 2 options are required")
                
                correct_options = sum(1 for option in options if option.get('is_correct', False))
                if correct_options == 0:
                    raise serializers.ValidationError(f"Question {i+1}: At least one option must be correct")
                
                # For single choice questions, ensure only one correct option
                question_type = question_data.get('question_type', 'single')
                if question_type == 'single' and correct_options > 1:
                    raise serializers.ValidationError(f"Question {i+1}: Single choice questions can have only one correct option")
        
        # Ensure only one content type is specified
        content_specific_fields = ['pdf_file', 'video_file', 'questions']
        provided_fields = [field for field in content_specific_fields if data.get(field)]
        
        if len(provided_fields) > 1:
            raise serializers.ValidationError("Only one content type can be specified at a time")
        
        return data

    def create(self, validated_data):
        content_type_name = validated_data.pop('content_type')
        content_type = get_object_or_404(ContentType, name=content_type_name)
        
        module = self.context.get('module')
        if not module:
            raise serializers.ValidationError("Module is required to create content")
        
        pdf_file = validated_data.pop('pdf_file', None)
        video_file = validated_data.pop('video_file', None)
        questions_data = validated_data.pop('questions', [])
        passing_score = validated_data.pop('passing_score', 80)
        max_attempts = validated_data.pop('max_attempts', 3)
        time_limit = validated_data.pop('time_limit', 0)

        course_content = CourseContent.objects.create(
            module=module,
            content_type=content_type,
            **validated_data
        )

        if content_type_name == 'pdf' and pdf_file:
            PDFContent.objects.create(course_content=course_content, pdf_file=pdf_file)
        
        elif content_type_name == 'video' and video_file:
            VideoContent.objects.create(course_content=course_content, video_file=video_file)
        
        elif content_type_name == 'qcm' and questions_data:
            # Create QCM
            qcm = QCM.objects.create(
                course_content=course_content,
                passing_score=passing_score,
                max_attempts=max_attempts,
                time_limit=time_limit
            )
            
            # Create questions and options
            for question_data in questions_data:
                options_data = question_data.pop('options')
                
                question = QCMQuestion.objects.create(
                    qcm=qcm,
                    **question_data
                )
                
                for option_data in options_data:
                    QCMOption.objects.create(
                        question=question,  # Link to question
                        **option_data
                    )

        return course_content
class ModuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['title', 'description', 'order', 'status', 'estimated_duration', 'min_required_time']
    
    def create(self, validated_data):
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError("Course is required")
        
        module = Module.objects.create(course=course, **validated_data)
        return module

# Time Tracking Serializer
class TimeTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeTracking
        fields = ['id', 'user', 'course', 'module', 'content', 'start_time', 'end_time', 'duration', 'session_type']
        read_only_fields = ['id', 'user']

# Chat Message Serializer
class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_name', 'receiver', 'message', 'timestamp', 'is_read']
        read_only_fields = ['id', 'sender', 'timestamp']

class EnrollmentStatsSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'user_name', 'enrolled_at', 'progress', 'completed']

class ContentEngagementSerializer(serializers.Serializer):
    content_id = serializers.IntegerField()
    content_title = serializers.CharField()
    views = serializers.IntegerField()
    completions = serializers.IntegerField()
    average_time_spent = serializers.IntegerField()

# Add this serializer to your serializers.py file - it was referenced but not defined
# Updated version that matches your Subscription model
# Fix the CourseWithProgressSerializer to match your actual model
class SubscriptionWithProgressSerializer(serializers.ModelSerializer):
    user = SubscriberSerializer(read_only=True)
    user_full_name = serializers.SerializerMethodField()
    progress_percentage = serializers.FloatField(read_only=True)
    total_score = serializers.IntegerField(read_only=True)
    completed_contents_count = serializers.IntegerField(read_only=True)
    total_contents_count = serializers.IntegerField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    total_time_spent = serializers.IntegerField(read_only=True)
    average_time_per_session = serializers.IntegerField(read_only=True)
    can_complete_course = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'user_full_name', 'subscribed_at', 'is_active',
            'progress_percentage', 'total_score', 'completed_contents_count',
            'total_contents_count', 'is_completed', 'total_time_spent',
            'average_time_per_session', 'can_complete_course'
        ]
    
    def get_user_full_name(self, obj):
        return obj.user.full_name

    def get_progress_percentage(self, obj):
        return obj.progress_percentage

    def get_total_score(self, obj):
        return obj.total_score

    def get_completed_contents_count(self, obj):
        return obj.completed_contents_count

    def get_total_contents_count(self, obj):
        return obj.total_contents_count

    def get_is_completed(self, obj):
        return obj.is_completed

    def get_total_time_spent(self, obj):
        return obj.total_time_spent

    def get_average_time_per_session(self, obj):
        return obj.average_time_per_session

    def get_can_complete_course(self, obj):
        return obj.can_complete_course

class CourseWithProgressSerializer(serializers.ModelSerializer):
    subscribers = SubscriptionWithProgressSerializer(
        many=True, 
        read_only=True, 
        source='course_subscriptions'
    )
    subscribers_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'title_of_course', 'description', 'department', 'department_display', 'image', 
            'subscribers_count', 'subscribers', 'average_score', 'created_at'
        ]
    
    def get_subscribers_count(self, obj):
        return obj.course_subscriptions.filter(is_active=True).count()
    
    def get_average_score(self, obj):
        active_subscriptions = obj.course_subscriptions.filter(is_active=True)
        if active_subscriptions.exists():
            # Calculate average total_score from subscriptions
            total_scores = active_subscriptions.aggregate(avg_score=Avg('total_score'))
            return total_scores['avg_score'] or 0
        return 0
class CourseStatsSerializer(serializers.Serializer):
    total_enrollments = serializers.IntegerField()
    completed_enrollments = serializers.IntegerField()
    average_progress = serializers.IntegerField()
    recent_enrollments = EnrollmentStatsSerializer(many=True)
    content_engagement = ContentEngagementSerializer(many=True)

# A
class FavoriteCourseSerializer(serializers.ModelSerializer):
    """Serializer for displaying favorite courses"""
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    course_title = serializers.CharField(source='course.title_of_course', read_only=True)
    course_description = serializers.CharField(source='course.description', read_only=True)
    course_image = serializers.SerializerMethodField()
    course_department = serializers.CharField(source='course.department', read_only=True)
    course_department_display = serializers.CharField(source='course.get_department_display', read_only=True)
    course_status = serializers.IntegerField(source='course.status', read_only=True)
    course_status_display = serializers.CharField(source='course.get_status_display', read_only=True)
    
    # Creator information
    creator_username = serializers.CharField(source='course.creator.username', read_only=True)
    creator_full_name = serializers.CharField(source='course.creator.full_name', read_only=True)
    creator_first_name = serializers.CharField(source='course.creator.first_name', read_only=True)
    creator_last_name = serializers.CharField(source='course.creator.last_name', read_only=True)
    
    # Additional course info
    estimated_duration = serializers.IntegerField(source='course.estimated_duration', read_only=True)
    min_required_time = serializers.IntegerField(source='course.min_required_time', read_only=True)
    
    # User-specific info
    is_subscribed = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = FavoriteCourse
        fields = [
            'id', 'course_id', 'course_title', 'course_description', 'course_image',
            'course_department', 'course_department_display', 'course_status', 
            'course_status_display', 'creator_username', 'creator_full_name',
            'creator_first_name', 'creator_last_name', 'estimated_duration',
            'min_required_time', 'is_subscribed', 'progress_percentage', 'added_at'
        ]
    
    def get_course_image(self, obj):
        if obj.course.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.course.image.url)
            return obj.course.image.url
        return None
    
    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Subscription.objects.filter(
                user=request.user,
                course=obj.course,
                is_active=True
            ).exists()
        return False
    
    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            subscription = Subscription.objects.filter(
                user=request.user,
                course=obj.course,
                is_active=True
            ).first()
            if subscription:
                return subscription.progress_percentage
        return 0.0


class FavoriteCourseCreateSerializer(serializers.ModelSerializer):
    """Serializer for adding/removing favorites"""
    class Meta:
        model = FavoriteCourse
        fields = ['course']
    
    def validate_course(self, value):
        # Ensure course is active
        if value.status != 1:
            raise serializers.ValidationError("Can only favorite active courses")
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        course = validated_data['course']
        
        # Check if already favorited
        favorite, created = FavoriteCourse.objects.get_or_create(
            user=user,
            course=course
        )
        
        if not created:
            raise serializers.ValidationError("Course is already in favorites")
        
        return favorite

