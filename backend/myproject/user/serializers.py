from rest_framework import serializers
from .models import CustomUser, QCMAttempt, QCMCompletion, Course, CourseContent, VideoContent, PDFContent, QCM, QCMOption, ContentType, Subscription
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.db import models

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

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 
            'first_name', 'last_name', 
            'privilege', 'department', 'department_display', 'password'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
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
        fields = ['id', 'text', 'is_correct']

# QCM Serializer
class QCMSerializer(serializers.ModelSerializer):
    options = QCMOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QCM
        fields = ['id', 'question', 'options']

# Video Content Serializer
class VideoContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoContent
        fields = ['id', 'video_file']

# PDF Content Serializer
class PDFContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFContent
        fields = ['id', 'pdf_file']

# Course Content Serializer
class CourseContentSerializer(serializers.ModelSerializer):
    video_content = VideoContentSerializer(read_only=True)
    pdf_content = PDFContentSerializer(read_only=True)
    qcm = QCMSerializer(read_only=True)
    content_type_name = serializers.CharField(source='content_type.name', read_only=True)
    
    class Meta:
        model = CourseContent
        fields = ['id', 'title', 'caption', 'order', 'content_type_name', 
                 'video_content', 'pdf_content', 'qcm']

# Course Serializer
from rest_framework import serializers
from django.urls import reverse
from django.conf import settings

class CourseSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title_of_course', 'description', 'image_url', 'department', 'created_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                # This will return absolute URLs like http://localhost:8000/media/...
                return request.build_absolute_uri(obj.image.url)
            # Fallback for when request is not available
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
            'image',
            'creator_username',
            'creator_first_name',
            'creator_last_name'
        ]
    
    def create(self, validated_data):
        # Get the request from context
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            # User is authenticated, set them as creator
            validated_data['creator'] = request.user
            print(f"Setting creator to authenticated user: {request.user.username}")
        else:
            # User is not authenticated, allow creation without creator or handle differently
            print("No authenticated user found, setting creator to None")
            validated_data['creator'] = None
        
        try:
            # Create the course
            course = Course.objects.create(**validated_data)
            print(f"Course created successfully: {course.title_of_course}")
            return course
        except Exception as e:
            print(f"Error creating course: {str(e)}")
            raise serializers.ValidationError(f"Failed to create course: {str(e)}")

# QCM Option Create Serializer
class QCMOptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCMOption
        fields = ['text', 'is_correct']

# PDF Content Create Serializer
class PDFContentCreateSerializer(serializers.ModelSerializer):
    pdf_file = serializers.FileField(required=True)
    
    class Meta:
        model = CourseContent
        fields = ['title', 'caption', 'order', 'pdf_file']
    
    def create(self, validated_data):
        pdf_file = validated_data.pop('pdf_file')
        
        course = self.context.get('course')
        content_type = self.context.get('content_type')
        
        if not course or not content_type:
            raise serializers.ValidationError("Course and content type are required")
        
        # Create the course content
        course_content = CourseContent.objects.create(
            course=course,
            content_type=content_type,
            **validated_data
        )
        
        # Create the PDF content
        PDFContent.objects.create(course_content=course_content, pdf_file=pdf_file)
        return course_content

# Video Content Create Serializer
class VideoContentCreateSerializer(serializers.ModelSerializer):
    video_file = serializers.FileField(required=True)
    
    class Meta:
        model = CourseContent
        fields = ['title', 'caption', 'order', 'video_file']
    
    def create(self, validated_data):
        video_file = validated_data.pop('video_file')
        
        course = self.context.get('course')
        content_type = self.context.get('content_type')
        
        if not course or not content_type:
            raise serializers.ValidationError("Course and content type are required")
        
        # Create the course content
        course_content = CourseContent.objects.create(
            course=course,
            content_type=content_type,
            **validated_data
        )
        
        # Create the video content
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
    
    class Meta:
        model = CourseContent
        fields = ['title', 'caption', 'order', 'qcm_question', 'qcm_options',
                 'points', 'passing_score', 'max_attempts', 'time_limit']
    
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
        
        course = self.context.get('course')
        content_type = self.context.get('content_type')
        
        if not course or not content_type:
            raise serializers.ValidationError("Course and content type are required")
        
        # Create the course content
        course_content = CourseContent.objects.create(
            course=course,
            content_type=content_type,
            **validated_data
        )
        
        # Create the QCM
        qcm = QCM.objects.create(
            course_content=course_content,
            question=qcm_question,
            points=points,
            passing_score=passing_score,
            max_attempts=max_attempts,
            time_limit=time_limit
        )
        
        # Create the options
        for option_data in qcm_options:
            QCMOption.objects.create(qcm=qcm, **option_data)
        
        return course_content

# Subscriber Serializer
class SubscriberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'department', 'department_display']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

# Subscription Serializer
class SubscriptionSerializer(serializers.ModelSerializer):
    user = SubscriberSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'user', 'subscribed_at', 'is_active']

# Course with Subscribers Serializer
class CourseWithSubscribersSerializer(serializers.ModelSerializer):
    subscribers = SubscriptionSerializer(many=True, read_only=True, source='course_subscriptions')
    subscribers_count = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'title_of_course', 'description', 'department', 'department_display', 'image', 
                 'subscribers_count', 'subscribers', 'created_at']
    
    def get_subscribers_count(self, obj):
        return obj.course_subscriptions.filter(is_active=True).count()

# Subscription with Progress Serializer
class SubscriptionWithProgressSerializer(serializers.ModelSerializer):
    user = SubscriberSerializer(read_only=True)
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'user_full_name', 'subscribed_at', 'is_active',
            'score', 'level', 'progress_percentage', 'last_activity'
        ]
    
    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

# Course with Progress Serializer
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
            return active_subscriptions.aggregate(avg_score=models.Avg('score'))['avg_score']
        return 0

# QCM Detail Serializer
class QCMDetailSerializer(serializers.ModelSerializer):
    options = QCMOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QCM
        fields = ['id', 'question', 'points', 'passing_score', 'max_attempts', 'time_limit', 'options']

# QCM Attempt Serializer
class QCMAttemptSerializer(serializers.ModelSerializer):
    selected_option_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    
    class Meta:
        model = QCMAttempt
        fields = ['id', 'selected_option_ids', 'score', 'points_earned', 'is_passed', 'attempt_number', 'time_taken']
        read_only_fields = ['score', 'points_earned', 'is_passed', 'attempt_number']

# QCM Completion Serializer
class QCMCompletionSerializer(serializers.ModelSerializer):
    qcm_title = serializers.CharField(source='qcm.question', read_only=True)
    
    class Meta:
        model = QCMCompletion
        fields = ['qcm', 'qcm_title', 'best_score', 'points_earned', 'is_passed', 'attempts_count', 'last_attempt']

# QCM Create Serializer
class QCMCreateSerializer(serializers.ModelSerializer):
    options = QCMOptionCreateSerializer(many=True)
    
    class Meta:
        model = QCM
        fields = ['question', 'points', 'passing_score', 'max_attempts', 'time_limit', 'options']
    
    def create(self, validated_data):
        options_data = validated_data.pop('options')
        qcm = QCM.objects.create(**validated_data)
        
        for option_data in options_data:
            QCMOption.objects.create(qcm=qcm, **option_data)
        
        return qcm