from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    CustomUser, Course, ContentType, CourseContent, QCM, 
    Subscription, QCMCompletion, VideoContent, PDFContent, 
    QCMOption, QCMAttempt, Module
)

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 
                   'privilege', 'department', 'is_staff', 'is_active')
    list_filter = ('privilege', 'department', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Additional info'), {'fields': ('privilege', 'department')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 
                      'first_name', 'last_name', 'privilege', 'department'),
        }),
    )

# Module Admin
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('course', 'title', 'order')
    list_filter = ('course',)
    search_fields = ('title', 'course__title_of_course')
    ordering = ('course', 'order')

# Course Admin
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title_of_course', 'creator', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title_of_course', 'creator__username')
    readonly_fields = ('created_at', 'updated_at')

# ContentType Admin
class ContentTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

# CourseContent Admin (CORRECTED)
class CourseContentAdmin(admin.ModelAdmin):
    list_display = ('get_course', 'module', 'content_type', 'title', 'order')
    list_filter = ('content_type', 'module__course')
    search_fields = ('title', 'module__course__title_of_course')
    ordering = ('module__course', 'order')
    
    def get_course(self, obj):
        return obj.module.course.title_of_course if obj.module and obj.module.course else 'No Course'
    get_course.short_description = 'Course'
    get_course.admin_order_field = 'module__course__title_of_course'

# QCM Admin
class QCMAdmin(admin.ModelAdmin):
    list_display = ('course_content', 'question', 'points', 'passing_score', 'max_attempts')
    list_filter = ('points', 'max_attempts')
    search_fields = ('question', 'course_content__title')

# Subscription Admin
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'subscribed_at', 'is_active', 'total_score')
    list_filter = ('is_active', 'subscribed_at')
    search_fields = ('user__username', 'course__title_of_course')
    readonly_fields = ('subscribed_at',)

# QCMCompletion Admin
class QCMCompletionAdmin(admin.ModelAdmin):
    list_display = ('subscription', 'qcm', 'best_score', 'points_earned', 'is_passed', 'attempts_count')
    list_filter = ('is_passed', 'last_attempt')
    readonly_fields = ('last_attempt',)

# VideoContent Admin
class VideoContentAdmin(admin.ModelAdmin):
    list_display = ('course_content',)
    search_fields = ('course_content__title',)

# PDFContent Admin
class PDFContentAdmin(admin.ModelAdmin):
    list_display = ('course_content',)
    search_fields = ('course_content__title',)

# QCMOption Admin
class QCMOptionAdmin(admin.ModelAdmin):
    list_display = ('qcm', 'text', 'is_correct')
    list_filter = ('is_correct', 'qcm')
    search_fields = ('text', 'qcm__question')

# QCMAttempt Admin
class QCMAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'qcm', 'score', 'points_earned', 'is_passed', 'attempt_number')
    list_filter = ('is_passed', 'started_at')
    readonly_fields = ('started_at', 'completed_at')
    search_fields = ('user__username', 'qcm__question')

# Register all models
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Module, ModuleAdmin)
admin.site.register(Course, CourseAdmin)
admin.site.register(ContentType, ContentTypeAdmin)
admin.site.register(CourseContent, CourseContentAdmin)
admin.site.register(QCM, QCMAdmin)
admin.site.register(Subscription, SubscriptionAdmin)
admin.site.register(QCMCompletion, QCMCompletionAdmin)
admin.site.register(VideoContent, VideoContentAdmin)
admin.site.register(PDFContent, PDFContentAdmin)
admin.site.register(QCMOption, QCMOptionAdmin)
admin.site.register(QCMAttempt, QCMAttemptAdmin)