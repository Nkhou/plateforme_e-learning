from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    CustomUser, Course, ContentType, CourseContent, QCM, 
    Subscription, QCMCompletion, VideoContent, PDFContent, 
    QCMOption, QCMAttempt, Module, QCMQuestion, TimeTracking, 
    ChatMessage, Enrollment, ContentProgress
)

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 
                   'privilege', 'department', 'status', 'suspended_at', 'is_staff', 'is_active')
    list_filter = ('privilege', 'department', 'status', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Additional info'), {'fields': ('privilege', 'department', 'status', 'suspended_at', 'suspension_reason')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 
                      'first_name', 'last_name', 'privilege', 'department', 'status'),
        }),
    )
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    get_status_display.short_description = 'Status'

# Module Admin
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'status_display', 'order', 'created_at')
    list_filter = ('course', 'status', 'created_at')
    search_fields = ('title', 'description', 'course__title_of_course')
    ordering = ('course', 'order')
    fields = ('course', 'title', 'description', 'status', 'order', 'estimated_duration', 'min_required_time')
    readonly_fields = ('created_at', 'updated_at')
    
    def status_display(self, obj):
        return obj.get_status_display()
    status_display.short_description = 'Status'

# Course Admin
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title_of_course', 'creator', 'status_display', 'department', 'created_at', 'updated_at')
    list_filter = ('status', 'department', 'created_at', 'updated_at')
    search_fields = ('title_of_course', 'description', 'creator__username')
    readonly_fields = ('created_at', 'updated_at')
    fields = ('title_of_course', 'description', 'department', 'image', 'creator', 'status', 
              'estimated_duration', 'min_required_time')
    
    def status_display(self, obj):
        return obj.get_status_display()
    status_display.short_description = 'Status'

# ContentType Admin
class ContentTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name')
    search_fields = ('name', 'display_name')

# CourseContent Admin
class CourseContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'module_display', 'content_type', 'status_display', 'order', 'created_at')
    list_filter = ('content_type', 'status', 'module__course')
    search_fields = ('title', 'caption', 'module__course__title_of_course')
    ordering = ('module__course', 'order')
    fields = ('module', 'content_type', 'title', 'caption', 'status', 'order', 
              'estimated_duration', 'min_required_time', 'views_count', 'completed_count')
    
    def module_display(self, obj):
        return f"{obj.module.course.title_of_course} - {obj.module.title}" if obj.module else "No Module"
    module_display.short_description = 'Course - Module'
    module_display.admin_order_field = 'module__course__title_of_course'
    
    def status_display(self, obj):
        return obj.get_status_display()
    status_display.short_description = 'Status'

# FIXED: QCM Admin - Updated for new model structure
class QCMAdmin(admin.ModelAdmin):
    list_display = ('content_title', 'questions_count', 'passing_score', 'max_attempts', 'time_limit')
    list_filter = ('passing_score', 'max_attempts', 'time_limit')
    search_fields = ('course_content__title',)
    fields = ('course_content', 'passing_score', 'max_attempts', 'time_limit')
    
    def content_title(self, obj):
        return obj.course_content.title if obj.course_content else "No Content"
    content_title.short_description = 'Content Title'
    content_title.admin_order_field = 'course_content__title'
    
    def questions_count(self, obj):
        return obj.questions.count()
    questions_count.short_description = 'Questions Count'

# QCMQuestion Admin
class QCMQuestionAdmin(admin.ModelAdmin):
    list_display = ('qcm_display', 'question_preview', 'question_type', 'points', 'order')
    list_filter = ('question_type', 'qcm')
    search_fields = ('question', 'qcm__course_content__title')
    ordering = ('qcm', 'order')
    
    def qcm_display(self, obj):
        return obj.qcm.course_content.title if obj.qcm and obj.qcm.course_content else "No QCM"
    qcm_display.short_description = 'QCM'
    
    def question_preview(self, obj):
        return obj.question[:50] + "..." if obj.question and len(obj.question) > 50 else obj.question
    question_preview.short_description = 'Question'

# Subscription Admin
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'subscribed_at', 'is_active', 'total_score', 'progress_percentage', 'is_completed')
    list_filter = ('is_active', 'is_completed', 'subscribed_at')
    search_fields = ('user__username', 'course__title_of_course')
    readonly_fields = ('subscribed_at', 'completed_at')
    fields = ('user', 'course', 'is_active', 'total_score', 'progress_percentage', 
              'total_time_spent', 'is_completed', 'completed_at')

# QCMCompletion Admin
class QCMCompletionAdmin(admin.ModelAdmin):
    list_display = ('subscription', 'qcm_display', 'best_score', 'points_earned', 'is_passed', 'attempts_count', 'last_attempt')
    list_filter = ('is_passed', 'last_attempt')
    readonly_fields = ('last_attempt',)
    
    def qcm_display(self, obj):
        return obj.qcm.course_content.title if obj.qcm and obj.qcm.course_content else "No QCM"
    qcm_display.short_description = 'QCM'

# VideoContent Admin
class VideoContentAdmin(admin.ModelAdmin):
    list_display = ('content_title', 'duration_display')
    search_fields = ('course_content__title',)
    
    def content_title(self, obj):
        return obj.course_content.title if obj.course_content else "No Content"
    content_title.short_description = 'Content Title'
    
    def duration_display(self, obj):
        if obj.duration:
            minutes = obj.duration // 60
            seconds = obj.duration % 60
            return f"{minutes}:{seconds:02d}"
        return "N/A"
    duration_display.short_description = 'Duration'

# PDFContent Admin
class PDFContentAdmin(admin.ModelAdmin):
    list_display = ('content_title', 'page_count', 'estimated_reading_time')
    search_fields = ('course_content__title',)
    
    def content_title(self, obj):
        return obj.course_content.title if obj.course_content else "No Content"
    content_title.short_description = 'Content Title'

# QCMOption Admin - FIXED: Updated for new structure
class QCMOptionAdmin(admin.ModelAdmin):
    list_display = ('question_display', 'text_preview', 'is_correct', 'order')
    list_filter = ('is_correct', 'question__qcm')
    search_fields = ('text', 'question__question')
    
    def question_display(self, obj):
        if obj.question:
            qcm_title = obj.question.qcm.course_content.title if obj.question.qcm and obj.question.qcm.course_content else "No QCM"
            return f"{qcm_title} - Q{obj.question.order}"
        return "No Question"
    question_display.short_description = 'Question'
    
    def text_preview(self, obj):
        return obj.text[:50] + "..." if obj.text and len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Option Text'

# QCMAttempt Admin
class QCMAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'qcm_display', 'score', 'points_earned', 'is_passed', 'attempt_number', 'time_taken', 'started_at')
    list_filter = ('is_passed', 'started_at')
    readonly_fields = ('started_at', 'completed_at')
    search_fields = ('user__username', 'qcm__course_content__title')
    
    def qcm_display(self, obj):
        return obj.qcm.course_content.title if obj.qcm and obj.qcm.course_content else "No QCM"
    qcm_display.short_description = 'QCM'

# TimeTracking Admin
class TimeTrackingAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_course', 'session_type', 'duration_display', 'start_time')
    list_filter = ('session_type', 'start_time', 'course')
    search_fields = ('user__username', 'course__title_of_course')
    readonly_fields = ('created_at',)
    
    def get_course(self, obj):
        return obj.course.title_of_course if obj.course else "No Course"
    get_course.short_description = 'Course'
    
    def duration_display(self, obj):
        if obj.duration:
            minutes = obj.duration // 60
            seconds = obj.duration % 60
            return f"{minutes}m {seconds}s"
        return "N/A"
    duration_display.short_description = 'Duration'

# ChatMessage Admin
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'message_preview', 'timestamp', 'is_read')
    list_filter = ('is_read', 'timestamp')
    search_fields = ('sender__username', 'receiver__username', 'message')
    readonly_fields = ('timestamp',)
    
    def message_preview(self, obj):
        return obj.message[:50] + "..." if obj.message and len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'

# Enrollment Admin
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'enrolled_at', 'completed', 'progress')
    list_filter = ('completed', 'enrolled_at')
    search_fields = ('user__username', 'course__title_of_course')
    readonly_fields = ('enrolled_at',)

# ContentProgress Admin
class ContentProgressAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'content', 'completed', 'viewed_at', 'time_spent_display')
    list_filter = ('completed', 'viewed_at')
    search_fields = ('enrollment__user__username', 'content__title')
    readonly_fields = ('viewed_at',)
    
    def time_spent_display(self, obj):
        if obj.time_spent:
            minutes = obj.time_spent // 60
            seconds = obj.time_spent % 60
            return f"{minutes}m {seconds}s"
        return "N/A"
    time_spent_display.short_description = 'Time Spent'

# Register all models (REMOVED DUPLICATE QCM REGISTRATION)
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Module, ModuleAdmin)
admin.site.register(Course, CourseAdmin)
admin.site.register(ContentType, ContentTypeAdmin)
admin.site.register(CourseContent, CourseContentAdmin)
admin.site.register(QCM, QCMAdmin)  # This is the only registration for QCM
admin.site.register(QCMQuestion, QCMQuestionAdmin)
admin.site.register(Subscription, SubscriptionAdmin)
admin.site.register(QCMCompletion, QCMCompletionAdmin)
admin.site.register(VideoContent, VideoContentAdmin)
admin.site.register(PDFContent, PDFContentAdmin)
admin.site.register(QCMOption, QCMOptionAdmin)
admin.site.register(QCMAttempt, QCMAttemptAdmin)
admin.site.register(TimeTracking, TimeTrackingAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)
admin.site.register(Enrollment, EnrollmentAdmin)
admin.site.register(ContentProgress, ContentProgressAdmin)