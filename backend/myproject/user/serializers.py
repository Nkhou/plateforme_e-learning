from rest_framework import serializers
from .models import CustomUser, QCMAttempt, QCMCompletion, Course, Module, CourseContent, VideoContent, PDFContent, QCM, QCMOption, ContentType, Subscription, Enrollment
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Sum
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

# QCM Option Create Serializer
class QCMOptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCMOption
        fields = ['text', 'is_correct']

# class QCMSerializer(serializers.ModelSerializer):
#     options = QCMOptionSerializer(many=True, read_only=True)
    
#     class Meta:
#         model = QCM
#         fields = ['id', 'question', 'options', 'points', 'passing_score', 'max_attempts', 'time_limit']

# class VideoContentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = VideoContent
#         fields = ['id', 'video_file'] 

# class PDFContentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PDFContent
#         fields = ['id', 'pdf_file']
#         read_only_fields = ['id', 'pdf_file'] 


class PDFContentSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='course_content.title', required=False)
    caption = serializers.CharField(source='course_content.caption', required=False)
    order = serializers.IntegerField(source='course_content.order', required=False)
    
    class Meta:
        model = PDFContent
        fields = ['id', 'pdf_file', 'title', 'caption', 'order']
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
    
    class Meta:
        model = VideoContent
        fields = ['id', 'video_file', 'title', 'caption', 'order']
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

# class QCMOptionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = QCMOption
#         fields = ['id', 'text', 'is_correct']

class QCMSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='course_content.title', required=False)
    caption = serializers.CharField(source='course_content.caption', required=False)
    order = serializers.IntegerField(source='course_content.order', required=False)
    
    # FIX: Try the most likely relationship names
    # If your QCMOption model has: qcm = models.ForeignKey(QCM, related_name='options')
    options = QCMOptionSerializer(many=True, read_only=True)
    
    # Alternative if the above doesn't work, try:
    # options = QCMOptionSerializer(source='qcm_options', many=True, read_only=True)
    # or
    # options = QCMOptionSerializer(source='qcmoption_set', many=True, read_only=True)
    
    class Meta:
        model = QCM
        fields = [
            'id', 'question', 'points', 'passing_score', 'max_attempts', 'time_limit',
            'title', 'caption', 'order', 'options'
        ]
        read_only_fields = ['id']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Debug: Print available relationships
        print(f"QCM {instance.id} available attributes:")
        qcm_attrs = [attr for attr in dir(instance) if not attr.startswith('_')]
        option_related = [attr for attr in qcm_attrs if 'option' in attr.lower()]
        print(f"Option-related attributes: {option_related}")
        
        # Check different possible sources
        options_count = 0
        if hasattr(instance, 'options'):
            options_count = instance.options.count()
            print(f"instance.options count: {options_count}")
        if hasattr(instance, 'qcm_options'):
            options_count = instance.qcm_options.count()
            print(f"instance.qcm_options count: {options_count}")
        if hasattr(instance, 'qcmoption_set'):
            options_count = instance.qcmoption_set.count()
            print(f"instance.qcmoption_set count: {options_count}")
            
        print(f"Final options in representation: {len(representation.get('options', []))}")
        return representation
    
    def update(self, instance, validated_data):
        content_data = validated_data.pop('course_content', {})
        if content_data:
            content = instance.course_content
            for attr, value in content_data.items():
                setattr(content, attr, value)
            content.save()
        
        return super().update(instance, validated_data)
# class ModuleSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Module
#         fields = ['id', 'title', 'description', 'order']
class ModuleSerializer(serializers.ModelSerializer):
    contents = serializers.SerializerMethodField()
    content_stats = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'status', 'status_display', 'contents', 'content_stats']
    
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


from django.db.models import Avg
class ModuleWithContentsSerializer(serializers.ModelSerializer):
    contents = serializers.SerializerMethodField()
    content_stats = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'status', 'status_display', 'contents', 'content_stats']
    
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
        course = obj.course
        
        total_enrolled = Subscription.objects.filter(course=course, is_active=True).count()
        total_completed = Subscription.objects.filter(
            course=course, 
            is_active=True, 
            progress_percentage=100
        ).count()
        
        total_modules = Module.objects.filter(course=course).count()
        total_contents_course = CourseContent.objects.filter(module__course=course).count()
    
        completion_rate = 0
        if total_enrolled > 0:
            completion_rate = round((total_completed / total_enrolled) * 100, 2)
        
        progress_stats = Subscription.objects.filter(
            course=course, 
            is_active=True
        ).aggregate(
            avg_progress=Avg('progress_percentage')
        )
        average_progress = progress_stats['avg_progress'] or 0
        
        if hasattr(obj, 'prefetched_contents'):
            contents = obj.prefetched_contents
        else:
            contents = obj.contents.all()
        
        pdf_count = contents.filter(content_type__name='pdf').count()
        video_count = contents.filter(content_type__name='Video').count()
        qcm_count = contents.filter(content_type__name='QCM').count()
        total_contents_module = contents.count()
        
        return {
            'total_users_enrolled': total_enrolled,
            'total_users_completed': total_completed,
            'total_courses_completed': total_completed,
            'total_modules': total_modules,
            'total_contents_course': total_contents_course,
            'completion_rate': completion_rate,
            'average_progress': round(average_progress, 2),
            'total_contents_module': total_contents_module,
            'pdf_count': pdf_count,
            'video_count': video_count,
            'qcm_count': qcm_count,
        }

class CourseContentSerializer(serializers.ModelSerializer):
    video_content = VideoContentSerializer(read_only=True)
    pdf_content = PDFContentSerializer(read_only=True)
    qcm = QCMSerializer(read_only=True)
    content_type_name = serializers.CharField(source='content_type.name', read_only=True)
    is_completed = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CourseContent
        fields = ['id', 'title', 'caption', 'order', 'status', 'status_display', 'content_type_name', 
                 'video_content', 'pdf_content', 'qcm', 'is_completed']
    
    def get_is_completed(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if not user or not user.is_authenticated:
            return False
        
        if obj.content_type.name.lower() == 'qcm' and obj.qcm:
            return QCMCompletion.objects.filter(
                subscription__user=user,
                subscription__course=obj.module.course,
                qcm=obj.qcm,
                is_passed=True
            ).exists()

        subscription = self.context.get('subscription')
        if not subscription:
            subscription = Subscription.objects.filter(
                user=user,
                course=obj.module.course,
                is_active=True
            ).first()

        if subscription:
            return subscription.completed_contents.filter(id=obj.id).exists()

        return False

class CourseSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    creator_username = serializers.SerializerMethodField()
    creator_first_name = serializers.SerializerMethodField()
    creator_last_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 
            'title_of_course', 
            'description', 
            'image_url', 
            'department', 
            'status',
            'status_display',
            'created_at',
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
    
    def get_creator_username(self, obj):
        return obj.creator.username
    
    def get_creator_first_name(self, obj):
        return obj.creator.first_name
    
    def get_creator_last_name(self, obj):
        return obj.creator.last_name

class CourseDetailSerializer(serializers.ModelSerializer):
    modules = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    creator_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'title_of_course', 'description', 'department', 'status', 'status_display', 
                 'image_url', 'creator_name', 'created_at', 'modules']
    
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
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"{settings.BASE_URL}{obj.image.url}" if hasattr(settings, 'BASE_URL') else obj.image.url
        return None
    
    def get_creator_name(self, obj):
        return f"{obj.creator.first_name} {obj.creator.last_name}"

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
        fields = ['question', 'passing_score', 'options']
    
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
    
    class Meta:
        model = CourseContent
        fields = ['title', 'caption', 'order', 'pdf_file']
    
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
    
    class Meta:
        model = CourseContent
        fields = ['title', 'caption', 'order', 'video_file']
    
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
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'department_display', 'privilege']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

# Subscription Serializer
class SubscriptionSerializer(serializers.ModelSerializer):
    user = SubscriberSerializer(read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    total_score = serializers.SerializerMethodField()
    completed_contents = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = ['id', 'user', 'subscribed_at', 'is_active', 'progress_percentage', 'total_score', 'completed_contents']
    
    def get_progress_percentage(self, obj):
        # Calculate total contents across all modules
        total_contents = CourseContent.objects.filter(module__course=obj.course).count()
        completed_count = obj.completed_contents.count()
        
        if total_contents > 0:
            return (completed_count / total_contents) * 100
        return 0
    
    def get_total_score(self, obj):
        total_score = QCMAttempt.objects.filter(
            user=obj.user,
            qcm__course_content__module__course=obj.course,
            is_passed=True
        ).aggregate(Sum('score'))['score__sum'] or 0
        
        return total_score
    
    def get_completed_contents(self, obj):
        return list(obj.completed_contents.values_list('id', flat=True))

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

    class Meta:
        model = CourseContent
        fields = [
            'title', 'caption', 'order', 'status', 'content_type',
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
        fields = ['title', 'description', 'order', 'status']
    
    def create(self, validated_data):
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError("Course is required")
        
        module = Module.objects.create(course=course, **validated_data)
        return module


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

class CourseStatsSerializer(serializers.Serializer):
    total_enrollments = serializers.IntegerField()
    completed_enrollments = serializers.IntegerField()
    average_progress = serializers.IntegerField()
    recent_enrollments = EnrollmentStatsSerializer(many=True)
    content_engagement = ContentEngagementSerializer(many=True)