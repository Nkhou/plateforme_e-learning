from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Course, ContentType, CourseContent, QCM, 
    Subscription, QCMCompletion, VideoContent, PDFContent, 
    QCMOption, QCMAttempt
)

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'Privilege', 'is_staff')
    list_filter = ('Privilege', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('Privilege',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('Privilege',)}),
    )

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

# CourseContent Admin
class CourseContentAdmin(admin.ModelAdmin):
    list_display = ('course', 'content_type', 'title', 'order')
    list_filter = ('content_type', 'course')
    search_fields = ('title', 'course__title_of_course')
    ordering = ('course', 'order')

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