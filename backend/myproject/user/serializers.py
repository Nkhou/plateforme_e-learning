from rest_framework import serializers
from .models import CustomUser, QCMAttempt, QCMCompletion, Course, CourseContent, VideoContent, PDFContent, QCM, QCMOption, ContentType, Subscription
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.db import models
from django.shortcuts import get_object_or_404

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
    # is_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = QCM
        fields = ['id', 'question', 'options', 'points', 'passing_score', 'max_attempts', 'time_limit']
    
    # def get_is_completed(self, obj):
    #     request = self.context.get('request')
    #     if request and request.user.is_authenticated:
    #         qcm_completion = QCMCompletion.objects.filter(
    #             subscription__user=request.user,
    #             subscription__course=obj.course_content.course,
    #             qcm=obj,
    #             is_passed=True
    #         ).exists()
    #         return qcm_completion
    #     return False

# Video Content Serializer
class VideoContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoContent
        fields = ['id', 'video_file']  # Include is_completed

# PDF Content Serializer
class PDFContentSerializer(serializers.ModelSerializer):
    # is_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = PDFContent
        fields = ['id', 'pdf_file']
        read_only_fields = ['id', 'pdf_file']  # All fields are read-only
    
    # def get_is_completed(self, obj):
    #     # Get the request from context
    #     request = self.context.get('request')
    #     if not request or not request.user.is_authenticated:
    #         return False
        
    #     # Get the course content associated with this PDF
    #     try:
    #         course_content = obj.course_content
    #         if not course_content:
    #             return False
            
    #         # Check if user has completed this content
    #         subscription = Subscription.objects.filter(
    #             user=request.user,
    #             course=course_content.course,
    #             is_active=True
    #         ).first()
    #         if subscription:
    #             print('---------------------------------------subscription', subscription.completed_contents.filter(id=course_content.id).exists())
    #             return subscription.completed_contents.filter(id=course_content.id).exists()
            
    #         return False
    #     except:
    #         return False

# Course Content Serializer
class CourseContentSerializer(serializers.ModelSerializer):
    video_content = VideoContentSerializer(read_only=True)
    pdf_content = PDFContentSerializer(read_only=True)
    qcm = QCMSerializer(read_only=True)
    content_type_name = serializers.CharField(source='content_type.name', read_only=True)
    is_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseContent
        fields = ['id', 'title', 'caption', 'order', 'content_type_name', 
                 'video_content', 'pdf_content', 'qcm', 'is_completed']
    
    def get_is_completed(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if not user or not user.is_authenticated:
            return False

        if obj.content_type.name.lower() == 'qcm' and obj.qcm:
            return QCMCompletion.objects.filter(
                subscription__user=user,
                subscription__course=obj.course,
                qcm=obj.qcm,
                is_passed=True
            ).exists()

        # For video or PDF
        subscription = self.context.get('subscription')
        if not subscription:
            subscription = Subscription.objects.filter(
                user=user,
                course=obj.course,
                is_active=True
            ).first()

        if subscription:
            return subscription.completed_contents.filter(id=obj.id).exists()

        return False

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

# Course Content Create Serializer (for handling all content types)
class CourseContentCreateSerializer(serializers.ModelSerializer):
    content_type = serializers.CharField(write_only=True)  # Accept string instead of ID
    pdf_file = serializers.FileField(required=False, allow_null=True)
    video_file = serializers.FileField(required=False, allow_null=True)
    qcm_question = serializers.CharField(required=False, allow_null=True)
    qcm_options = QCMOptionCreateSerializer(many=True, required=False, allow_null=True)
    points = serializers.IntegerField(required=False, default=1)
    passing_score = serializers.IntegerField(required=False, default=80)
    max_attempts = serializers.IntegerField(required=False, default=3)
    time_limit = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = CourseContent
        fields = [
            'title', 'caption', 'order', 'content_type',
            'pdf_file', 'video_file', 'qcm_question', 'qcm_options',
            'points', 'passing_score', 'max_attempts', 'time_limit'
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
        
        return data

    def create(self, validated_data):
        content_type_name = validated_data.pop('content_type')
        content_type = get_object_or_404(ContentType, name=content_type_name)
        course = self.context.get('course')
        
        # Extract content-specific data
        pdf_file = validated_data.pop('pdf_file', None)
        video_file = validated_data.pop('video_file', None)
        qcm_question = validated_data.pop('qcm_question', None)
        qcm_options = validated_data.pop('qcm_options', [])
        points = validated_data.pop('points', 1)
        passing_score = validated_data.pop('passing_score', 80)
        max_attempts = validated_data.pop('max_attempts', 3)
        time_limit = validated_data.pop('time_limit', 0)

        # Create the base course content
        course_content = CourseContent.objects.create(
            course=course,
            content_type=content_type,
            **validated_data
        )

        # Create specific content based on type
        if content_type_name == 'pdf' and pdf_file:
            PDFContent.objects.create(course_content=course_content, pdf_file=pdf_file)
        
        elif content_type_name == 'video' and video_file:
            VideoContent.objects.create(course_content=course_content, video_file=video_file)
        
        elif content_type_name == 'qcm' and qcm_question:
            qcm = QCM.objects.create(
                course_content=course_content,
                question=qcm_question,
                points=points,
                passing_score=passing_score,
                max_attempts=max_attempts,
                time_limit=time_limit
            )
            
            for option_data in qcm_options:
                QCMOption.objects.create(qcm=qcm, **option_data)

        return course_content