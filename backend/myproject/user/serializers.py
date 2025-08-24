from rest_framework import serializers
from .models import CustomUser, QCMAttempt, QCMCompletion
from django.contrib.auth.password_validation import validate_password

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 
            'first_name', 'last_name', 
            'Privilege', 'password'
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
# from rest_framework import serializers
from .models import Course, CourseContent, VideoContent, PDFContent, QCM, QCMOption, ContentType

# READ Serializers (for GET requests)
class QCMOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCMOption
        fields = ['id', 'text', 'is_correct']

class QCMSerializer(serializers.ModelSerializer):
    options = QCMOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QCM
        fields = ['id', 'question', 'options']

class VideoContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoContent
        fields = ['id', 'video_file']

class PDFContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFContent
        fields = ['id', 'pdf_file']

class CourseContentSerializer(serializers.ModelSerializer):
    video_content = VideoContentSerializer(read_only=True)
    pdf_content = PDFContentSerializer(read_only=True)
    qcm = QCMSerializer(read_only=True)
    content_type_name = serializers.CharField(source='content_type.name', read_only=True)
    
    class Meta:
        model = CourseContent
        fields = ['id', 'title', 'caption', 'order', 'content_type_name', 
                 'video_content', 'pdf_content', 'qcm']

from django.contrib.auth import get_user_model

User = get_user_model()

# Alternative approach using SerializerMethodField
class CourseSerializer(serializers.ModelSerializer):
    # Add creator information
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    creator_first_name = serializers.CharField(source='creator.first_name', read_only=True)
    creator_last_name = serializers.CharField(source='creator.last_name', read_only=True)
    
    # Add absolute image URL field
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'title_of_course', 
            'description', 
            'image',  # Original image field
            'image_url',  # Absolute URL field
            'creator_username',
            'creator_first_name', 
            'creator_last_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

# CREATE Serializers (for POST requests)
class CourseCreateSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    creator_first_name = serializers.CharField(source='creator.first_name', read_only=True)
    creator_last_name = serializers.CharField(source='creator.last_name', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'title_of_course', 
            'description', 
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
class QCMOptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCMOption
        fields = ['text', 'is_correct']
class CourseContentCreateSerializer(serializers.ModelSerializer):
    # For video content
    video_file = serializers.FileField(required=False, write_only=True)
    
    # For PDF content  
    pdf_file = serializers.FileField(required=False, write_only=True)
    
    # For QCM content
    qcm_question = serializers.CharField(required=False, write_only=True)
    qcm_options = QCMOptionCreateSerializer(many=True, required=False, write_only=True)
    
    # Add QCM settings fields
    points = serializers.IntegerField(required=False, write_only=True, default=1)
    passing_score = serializers.IntegerField(required=False, write_only=True, default=80)
    max_attempts = serializers.IntegerField(required=False, write_only=True, default=3)
    time_limit = serializers.IntegerField(required=False, write_only=True, default=0)
    
    class Meta:
        model = CourseContent
        fields = ['title', 'caption', 'order', 'content_type', 
                 'video_file', 'pdf_file', 'qcm_question', 'qcm_options',
                 'points', 'passing_score', 'max_attempts', 'time_limit']
        # Make content_type read-only since we set it automatically
        read_only_fields = ['content_type']
    
    def validate(self, data):
        # Get content_type from context instead of data
        content_type = self.context.get('content_type')
        
        if content_type.name == 'Video' and not data.get('video_file'):
            raise serializers.ValidationError("Video file is required for video content")
        
        if content_type.name == 'PDF' and not data.get('pdf_file'):
            raise serializers.ValidationError("PDF file is required for PDF content")
        
        if content_type.name == 'QCM':
            if not data.get('qcm_question'):
                raise serializers.ValidationError("Question is required for QCM content")
            if not data.get('qcm_options') or len(data.get('qcm_options', [])) < 2:
                raise serializers.ValidationError("At least 2 options are required for QCM content")
        
        return data
    
    def create(self, validated_data):
        video_file = validated_data.pop('video_file', None)
        pdf_file = validated_data.pop('pdf_file', None)
        qcm_question = validated_data.pop('qcm_question', None)
        qcm_options = validated_data.pop('qcm_options', [])
        
        # Extract QCM settings
        points = validated_data.pop('points', 1)
        passing_score = validated_data.pop('passing_score', 80)
        max_attempts = validated_data.pop('max_attempts', 3)
        time_limit = validated_data.pop('time_limit', 0)
        
        # Get course and content_type from context
        course = self.context.get('course')
        content_type = self.context.get('content_type')
        
        if not course or not content_type:
            raise serializers.ValidationError("Course and content type are required")
        
        # Create the course content with objects from context
        course_content = CourseContent.objects.create(
            course=course,
            content_type=content_type,
            **validated_data
        )
        
        # Create specific content based on type
        if content_type.name == 'Video' and video_file:
            VideoContent.objects.create(course_content=course_content, video_file=video_file)
        
        elif content_type.name == 'PDF' and pdf_file:
            PDFContent.objects.create(course_content=course_content, pdf_file=pdf_file)
        
        elif content_type.name == 'QCM' and qcm_question:
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

from .models import Course, Subscription, CustomUser

class SubscriberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'FirstName', 'LastName', 'full_name', 'email']
    
    def get_full_name(self, obj):
        return f"{obj.FirstName} {obj.LastName}"

class SubscriptionSerializer(serializers.ModelSerializer):
    user = SubscriberSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'user', 'subscribed_at', 'is_active']

class CourseWithSubscribersSerializer(serializers.ModelSerializer):
    subscribers = SubscriptionSerializer(many=True, read_only=True, source='course_subscriptions')
    subscribers_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title_of_course', 'description', 'image', 
                 'subscribers_count', 'subscribers', 'created_at']
    
    def get_subscribers_count(self, obj):
        return obj.course_subscriptions.filter(is_active=True).count()

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

class CourseWithProgressSerializer(serializers.ModelSerializer):
    subscribers = SubscriptionWithProgressSerializer(
        many=True, 
        read_only=True, 
        source='course_subscriptions'
    )
    subscribers_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title_of_course', 'description', 'image', 
            'subscribers_count', 'subscribers', 'average_score', 'created_at'
        ]
    
    def get_subscribers_count(self, obj):
        return obj.course_subscriptions.filter(is_active=True).count()
    
    def get_average_score(self, obj):
        active_subscriptions = obj.course_subscriptions.filter(is_active=True)
        if active_subscriptions.exists():
            return active_subscriptions.aggregate(avg_score=models.Avg('score'))['avg_score']
        return 0
class QCMOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCMOption
        fields = ['id', 'text']

class QCMDetailSerializer(serializers.ModelSerializer):
    options = QCMOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QCM
        fields = ['id', 'question', 'points', 'passing_score', 'max_attempts', 'time_limit', 'options']

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

class QCMCompletionSerializer(serializers.ModelSerializer):
    qcm_title = serializers.CharField(source='qcm.question', read_only=True)
    
    class Meta:
        model = QCMCompletion
        fields = ['qcm', 'qcm_title', 'best_score', 'points_earned', 'is_passed', 'attempts_count', 'last_attempt']

# Add this to your serializers.py
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