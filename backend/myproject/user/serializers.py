from rest_framework import serializers
from .models import (
    CustomUser, QCMAttempt, QCMCompletion, Course, Module, CourseContent, 
    VideoContent, PDFContent, QCM, QCMOption, ContentType, Subscription, 
    Enrollment, TimeTracking, ChatMessage
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

class QCMSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='course_content.title', required=False)
    caption = serializers.CharField(source='course_content.caption', required=False)
    order = serializers.IntegerField(source='course_content.order', required=False)
    status = serializers.IntegerField(source='course_content.status', required=False)
    status_display = serializers.CharField(source='course_content.status_display', read_only=True)
    estimated_duration = serializers.IntegerField(source='course_content.estimated_duration', required=False)
    min_required_time = serializers.IntegerField(source='course_content.min_required_time', required=False)
    
    options = QCMOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QCM
        fields = [
            'id', 'question', 'question_type', 'points', 'passing_score', 'max_attempts', 'time_limit',
            'title', 'caption', 'order', 'status', 'status_display', 'options',
            'estimated_duration', 'min_required_time'
        ]
        read_only_fields = ['id']
    
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
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order', 'status', 'status_display', 
            'estimated_duration', 'min_required_time', 'created_at', 'updated_at',
            'contents', 'content_stats'
        ]
    
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
    
        # ... rest of your method

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

        # Return data matching CourseStats interface EXACTLY
        return {
            'total_users_enrolled': total_enrolled,
            'total_users_completed': total_completed,
            # REMOVED: 'total_courses_completed': total_completed,  # No longer included
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
class CourseContentSerializer(serializers.ModelSerializer):
    video_content = VideoContentSerializer(read_only=True)
    pdf_content = PDFContentSerializer(read_only=True)
    qcm = QCMSerializer(read_only=True)
    content_type_name = serializers.CharField(source='content_type.name', read_only=True)
    is_completed = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
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
    
    def get_is_completed(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if not user or not user.is_authenticated:
            return False
        
        # Get or create subscription for this user and course
        subscription = self.context.get('subscription')
        if not subscription:
            try:
                subscription = Subscription.objects.filter(
                    user=user,
                    course=obj.module.course,
                    is_active=True
                ).first()
            except Subscription.DoesNotExist:
                return False
        
        if not subscription:
            return False

        # Check if content is marked as completed in subscription
        if subscription.completed_contents.filter(id=obj.id).exists():
            return True
        
        # For QCM content, check if passed attempts exist
        if obj.content_type.name.lower() == 'qcm':
            try:
                qcm = obj.qcm
                if qcm:
                    return QCMCompletion.objects.filter(
                        subscription=subscription,
                        qcm=qcm,
                        is_passed=True
                    ).exists()
            except QCM.DoesNotExist:
                pass
        
        return False

    def get_can_access(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        
        if not user or not user.is_authenticated:
            return False
            
        subscription = self.context.get('subscription')
        if not subscription:
            try:
                subscription = Subscription.objects.filter(
                    user=user,
                    course=obj.module.course,
                    is_active=True
                ).first()
            except Subscription.DoesNotExist:
                return False
            
        if subscription:
            return subscription.can_access_content(obj)
            
        return False

    def get_time_spent(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        
        if not user or not user.is_authenticated:
            return 0
            
        try:
            total_time = TimeTracking.objects.filter(
                user=user,
                content=obj
            ).aggregate(total_duration=Sum('duration'))['total_duration']
            
            return total_time or 0
        except Exception:
            return 0

    def get_last_accessed(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        
        if not user or not user.is_authenticated:
            return None
            
        try:
            last_tracking = TimeTracking.objects.filter(
                user=user,
                content=obj
            ).order_by('-end_time').first()
            
            return last_tracking.end_time.isoformat() if last_tracking else None
        except Exception:
            return None
class CourseSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    creator_first_name = serializers.CharField(source='creator.first_name', read_only=True)
    creator_last_name = serializers.CharField(source='creator.last_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
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
            'creator_username',
            'creator_first_name',
            'creator_last_name'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
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
                    return subscription.progress_percentage
                    
            except Subscription.DoesNotExist:
                pass
        
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
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'title_of_course', 'description', 'department', 'department_display',
            'status', 'status_display', 'image_url', 'creator_username', 
            'creator_first_name', 'creator_last_name', 'created_at', 'updated_at',
            'estimated_duration', 'min_required_time', 'modules'
        ]
    
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
        
        # ✅ USE ModuleWithContentsSerializer instead of ModuleSerializer
        return ModuleWithContentsSerializer(
            modules, 
            many=True, 
            context={'request': request, 'subscription': subscription}
        ).data
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"{settings.BASE_URL}{obj.image.url}" if hasattr(settings, 'BASE_URL') else obj.image.url
        return None

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
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            validated_data['creator'] = request.user
        else:
            validated_data['creator'] = None
        
        try:
            course = Course.objects.create(**validated_data)
            return course
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create course: {str(e)}")

# QCM Create Serializer
class QCMCreateSerializer(serializers.ModelSerializer):
    options = QCMOptionCreateSerializer(many=True)
    
    class Meta:
        model = QCM
        fields = ['question', 'question_type', 'passing_score', 'points', 'max_attempts', 'time_limit', 'options']
    
    def validate(self, data):
        options = data.get('options', [])
        correct_options = sum(1 for option in options if option.get('is_correct', False))
        
        if correct_options == 0:
            raise serializers.ValidationError("At least one option must be correct")
        
        return data
    
    def create(self, validated_data):
        options_data = validated_data.pop('options')
        qcm = QCM.objects.create(**validated_data)
        
        for option_data in options_data:
            QCMOption.objects.create(qcm=qcm, **option_data)
        
        return qcm

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
    qcm_question = serializers.CharField(required=True)
    qcm_options = QCMOptionCreateSerializer(many=True, required=True)
    points = serializers.IntegerField(default=1)
    passing_score = serializers.IntegerField(default=80)
    max_attempts = serializers.IntegerField(default=3)
    time_limit = serializers.IntegerField(default=0)
    question_type = serializers.ChoiceField(choices=[('single', 'Single'), ('multiple', 'Multiple')], default='single')
    title = serializers.CharField(required=True)
    caption = serializers.CharField(required=False, allow_blank=True)
    order = serializers.IntegerField(required=True)
    estimated_duration = serializers.IntegerField(required=False)
    min_required_time = serializers.IntegerField(required=False)

    class Meta:
        model = CourseContent
        fields = [
            'title', 'caption', 'order', 'estimated_duration', 'min_required_time',
            'qcm_question', 'qcm_options', 'points', 'passing_score', 'max_attempts', 
            'time_limit', 'question_type'
        ]
    
    def validate(self, data):
        qcm_options = data.get('qcm_options', [])
        if len(qcm_options) < 2:
            raise serializers.ValidationError("At least 2 options are required for QCM content")
        return data
    
    def create(self, validated_data):
        qcm_question = validated_data.pop('qcm_question')
        qcm_options = validated_data.pop('qcm_options')
        points = validated_data.pop('points', 1)
        passing_score = validated_data.pop('passing_score', 80)
        max_attempts = validated_data.pop('max_attempts', 3)
        time_limit = validated_data.pop('time_limit', 0)
        question_type = validated_data.pop('question_type', 'single')
        
        module = self.context.get('module')
        content_type = self.context.get('content_type')
        
        if not module or not content_type:
            raise serializers.ValidationError("Module and content type are required")
        
        course_content = CourseContent.objects.create(
            module=module,
            content_type=content_type,
            **validated_data
        )
        
        qcm = QCM.objects.create(
            course_content=course_content,
            question=qcm_question,
            question_type=question_type,
            points=points,
            passing_score=passing_score,
            max_attempts=max_attempts,
            time_limit=time_limit
        )
        
        for option_data in qcm_options:
            QCMOption.objects.create(qcm=qcm, **option_data)
        
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
class SubscriptionSerializer(serializers.ModelSerializer):
    user = SubscriberSerializer(read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)
    total_score = serializers.IntegerField(read_only=True)
    completed_contents_count = serializers.IntegerField(read_only=True)
    total_contents_count = serializers.IntegerField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    total_time_spent = serializers.IntegerField(read_only=True)
    average_time_per_session = serializers.IntegerField(read_only=True)
    can_complete_course = serializers.BooleanField(read_only=True)
    completion_requirements = serializers.DictField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'subscribed_at', 'is_active', 'progress_percentage', 
            'total_score', 'completed_contents_count', 'total_contents_count',
            'is_completed', 'total_time_spent', 'average_time_per_session',
            'can_complete_course', 'completion_requirements'
        ]

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
class CourseContentCreateSerializer(serializers.ModelSerializer):
    content_type = serializers.CharField(write_only=True)
    pdf_file = serializers.FileField(required=False, allow_null=True)
    video_file = serializers.FileField(required=False, allow_null=True)
    qcm_question = serializers.CharField(required=False, allow_null=True)
    qcm_options = QCMOptionCreateSerializer(many=True, required=False, allow_null=True)
    points = serializers.IntegerField(required=False, default=1)
    passing_score = serializers.IntegerField(required=False, default=80)
    max_attempts = serializers.IntegerField(required=False, default=3)
    time_limit = serializers.IntegerField(required=False, default=0)
    question_type = serializers.ChoiceField(choices=[('single', 'Single'), ('multiple', 'Multiple')], default='single')

    class Meta:
        model = CourseContent
        fields = [
            'title', 'caption', 'order', 'status', 'content_type',
            'estimated_duration', 'min_required_time',
            'pdf_file', 'video_file', 'qcm_question', 'qcm_options',
            'points', 'passing_score', 'max_attempts', 'time_limit', 'question_type'
        ]

    def validate(self, data):
        content_type_name = data.get('content_type')
        
        if content_type_name == 'pdf' and not data.get('pdf_file'):
            raise serializers.ValidationError("PDF file is required for PDF content")
        
        if content_type_name == 'video' and not data.get('video_file'):
            raise serializers.ValidationError("Video file is required for video content")
        
        if content_type_name == 'qcm':
            if not data.get('qcm_question'):
                raise serializers.ValidationError("QCM question is required")
            if not data.get('qcm_options') or len(data.get('qcm_options', [])) < 2:
                raise serializers.ValidationError("At least 2 QCM options are required")
            
            qcm_options = data.get('qcm_options', [])
            correct_options = sum(1 for option in qcm_options if option.get('is_correct', False))
            
            if correct_options == 0:
                raise serializers.ValidationError("At least one QCM option must be correct")
        
        content_specific_fields = ['pdf_file', 'video_file', 'qcm_question']
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
        qcm_question = validated_data.pop('qcm_question', None)
        qcm_options = validated_data.pop('qcm_options', [])
        points = validated_data.pop('points', 1)
        passing_score = validated_data.pop('passing_score', 80)
        max_attempts = validated_data.pop('max_attempts', 3)
        time_limit = validated_data.pop('time_limit', 0)
        question_type = validated_data.pop('question_type', 'single')

        course_content = CourseContent.objects.create(
            module=module,
            content_type=content_type,
            **validated_data
        )

        if content_type_name == 'pdf' and pdf_file:
            PDFContent.objects.create(course_content=course_content, pdf_file=pdf_file)
        
        elif content_type_name == 'video' and video_file:
            VideoContent.objects.create(course_content=course_content, video_file=video_file)
        
        elif content_type_name == 'qcm' and qcm_question:
            qcm = QCM.objects.create(
                course_content=course_content,
                question=qcm_question,
                question_type=question_type,
                points=points,
                passing_score=passing_score,
                max_attempts=max_attempts,
                time_limit=time_limit
            )
            
            for option_data in qcm_options:
                QCMOption.objects.create(qcm=qcm, **option_data)

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