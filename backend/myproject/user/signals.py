# user/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
import logging
from .models import Course, Module, CourseContent, Subscription, Notification, CustomUser

logger = logging.getLogger(__name__)

# ============================================================================
# HELPER FUNCTION - Get Department Users
# ============================================================================

def get_department_users(course):
    """
    Get all active users in the same department as the course.
    If no department, return all active users.
    Excludes the course creator.
    """
    users_query = CustomUser.objects.filter(
        is_active=True,
        status=1  # Only active users
    ).exclude(id=course.creator.id)
    
    # Filter by department if course has one
    if course.department:
        users_query = users_query.filter(department=course.department)
        logger.info(f"🎯 Target: Users in department '{course.get_department_display()}'")
    else:
        logger.info(f"🌍 Target: All active users (no department filter)")
    
    return users_query

# ============================================================================
# COURSE ACTIVATION SIGNAL - Notify All Department Users
# ============================================================================

@receiver(pre_save, sender=Course)
def store_old_course_status(sender, instance, **kwargs):
    """Store the old status before saving"""
    if instance.pk:
        try:
            old_course = Course.objects.get(pk=instance.pk)
            instance._old_status = old_course.status
        except Course.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Course)
def send_course_activation_email(sender, instance, created, **kwargs):
    """
    Send email to ALL users in the same department when course is activated
    """
    # Don't send on course creation
    if created:
        logger.info(f"Course created: {instance.title_of_course} - No email sent")
        return
    
    # Check if status changed to active
    old_status = getattr(instance, '_old_status', None)
    
    if instance.status == 1 and old_status != 1:
        logger.info(f"🔔 Course activated: {instance.title_of_course} (status: {old_status} → 1)")
        
        try:
            # Get ALL users in the same department
            department_users = get_department_users(instance)
            
            if not department_users.exists():
                logger.info(f"No users found in department for course: {instance.title_of_course}")
                return
            
            subject = f"New Course Available: {instance.title_of_course}"
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
            
            logger.info(f"📧 Sending course notification to {department_users.count()} users")
            
            success_count = 0
            error_count = 0
            
            for user in department_users:
                try:
                    # Check if user is already subscribed
                    is_subscribed = Subscription.objects.filter(
                        user=user,
                        course=instance,
                        is_active=True
                    ).exists()
                    
                    # Create notification
                    Notification.objects.create(
                        user=user,
                        notification_type='course_activated',
                        title="New course available",
                        message=f"The course '{instance.title_of_course}' is now available in your department.",
                        related_course=instance
                    )
                    
                    # Prepare course URL
                    course_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/courses/{instance.id}"
                    
                    # Render HTML email template
                    try:
                        html_message = render_to_string('emails/course_activated.html', {
                            'user': user,
                            'course': instance,
                            'course_url': course_url,
                            'is_subscribed': is_subscribed,
                            'timestamp': timezone.now()
                        })
                    except Exception as template_error:
                        logger.warning(f"Template error: {template_error}. Using fallback.")
                        # Fallback HTML if template fails
                        html_message = f"""
                        <html>
                            <body style="font-family: Arial, sans-serif; padding: 20px;">
                                <h2>New Course Available!</h2>
                                <p>Hello {user.first_name or user.username},</p>
                                <p>The course <strong>"{instance.title_of_course}"</strong> is now available.</p>
                                <p><a href="{course_url}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Learning Now</a></p>
                            </body>
                        </html>
                        """
                    
                    plain_message = strip_tags(html_message)
                    
                    # Send email
                    send_mail(
                        subject=subject,
                        message=plain_message,
                        from_email=from_email,
                        recipient_list=[user.email],
                        html_message=html_message,
                        fail_silently=False
                    )
                    
                    success_count += 1
                    logger.info(f"✅ Email sent to {user.email}")
                    
                except Exception as e:
                    error_count += 1
                    logger.error(f"❌ Failed to send to {user.email}: {str(e)}")
            
            logger.info(f"📊 Course Activation Summary - Sent: {success_count}, Failed: {error_count}")
                        
        except Exception as e:
            logger.error(f"❌ Error in course activation signal: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())


# ============================================================================
# MODULE ACTIVATION SIGNAL - Notify All Department Users
# ============================================================================

@receiver(pre_save, sender=Module)
def store_old_module_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_module = Module.objects.get(pk=instance.pk)
            instance._old_status = old_module.status
        except Module.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Module)
def send_module_activation_email(sender, instance, created, **kwargs):
    """Send email to ALL department users when module is activated"""
    if created:
        return
    
    old_status = getattr(instance, '_old_status', None)
    
    if instance.status == 1 and old_status != 1:
        logger.info(f"🔔 Module activated: {instance.title}")
        
        try:
            # Get ALL users in the same department
            department_users = get_department_users(instance.course)
            
            if not department_users.exists():
                logger.info("No users found in department")
                return
            
            subject = f"New Module Available: {instance.title}"
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
            
            logger.info(f"📧 Sending module notification to {department_users.count()} users")
            
            success_count = 0
            
            for user in department_users:
                try:
                    # Check subscription status
                    is_subscribed = Subscription.objects.filter(
                        user=user,
                        course=instance.course,
                        is_active=True
                    ).exists()
                    
                    # Create notification
                    Notification.objects.create(
                        user=user,
                        notification_type='module_activated',
                        title="New module available",
                        message=f"The module '{instance.title}' is available in course '{instance.course.title_of_course}'.",
                        related_course=instance.course,
                        related_module=instance
                    )
                    
                    # Prepare module URL
                    module_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/courses/{instance.course.id}/modules/{instance.id}"
                    
                    # Render HTML email template
                    try:
                        html_message = render_to_string('emails/module_activated.html', {
                            'user': user,
                            'course': instance.course,
                            'module': instance,
                            'module_url': module_url,
                            'is_subscribed': is_subscribed,
                            'timestamp': timezone.now()
                        })
                    except Exception as template_error:
                        logger.warning(f"Template error: {template_error}. Using fallback.")
                        # Fallback HTML
                        html_message = f"""
                        <html>
                            <body style="font-family: Arial, sans-serif; padding: 20px;">
                                <h2>New Module Available!</h2>
                                <p>Hello {user.first_name or user.username},</p>
                                <p>A new module <strong>"{instance.title}"</strong> has been added to the course <strong>"{instance.course.title_of_course}"</strong>.</p>
                                <p><a href="{module_url}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Explore Module</a></p>
                            </body>
                        </html>
                        """
                    
                    plain_message = strip_tags(html_message)
                    
                    send_mail(
                        subject=subject,
                        message=plain_message,
                        from_email=from_email,
                        recipient_list=[user.email],
                        html_message=html_message,
                        fail_silently=False
                    )
                    
                    success_count += 1
                    logger.info(f"✅ Sent to {user.email}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed: {str(e)}")
            
            logger.info(f"📊 Module notification - Sent: {success_count}")
                        
        except Exception as e:
            logger.error(f"❌ Error: {str(e)}")


# ============================================================================
# CONTENT CREATION & ACTIVATION SIGNAL - Notify All Department Users
# ============================================================================

@receiver(pre_save, sender=CourseContent)
def store_old_content_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_content = CourseContent.objects.get(pk=instance.pk)
            instance._old_status = old_content.status
            instance._is_new = False
        except CourseContent.DoesNotExist:
            instance._old_status = None
            instance._is_new = True
    else:
        instance._old_status = None
        instance._is_new = True

@receiver(post_save, sender=CourseContent)
def send_content_notification_email(sender, instance, created, **kwargs):
    """
    Send email to ALL department users when:
    1. Content is CREATED with status=1 (active)
    2. Content status CHANGES to active (0→1 or 2→1)
    """
    old_status = getattr(instance, '_old_status', None)
    
    # Determine if we should send notification
    should_notify = False
    action = ""
    
    if created and instance.status == 1:
        should_notify = True
        action = "added"
        logger.info(f"🆕 New active content created: {instance.title}")
    elif not created and instance.status == 1 and old_status != 1:
        should_notify = True
        action = "activated"
        logger.info(f"🔔 Content activated: {instance.title} (status: {old_status} → 1)")
    
    if not should_notify:
        return
    
    try:
        # Get ALL users in the same department
        department_users = get_department_users(instance.module.course)
        
        if not department_users.exists():
            logger.info("No users found in department")
            return
        
        subject = f"New Content Available: {instance.title}"
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
        
        logger.info(f"📧 Sending content notification to {department_users.count()} users")
        
        success_count = 0
        
        for user in department_users:
            try:
                # Check subscription status
                is_subscribed = Subscription.objects.filter(
                    user=user,
                    course=instance.module.course,
                    is_active=True
                ).exists()
                
                # Create notification
                Notification.objects.create(
                    user=user,
                    notification_type='content_activated',
                    title="New content available",
                    message=f"The content '{instance.title}' has been {action} in module '{instance.module.title}'.",
                    related_course=instance.module.course,
                    related_module=instance.module,
                    related_content=instance
                )
                
                # Prepare content URL
                content_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/courses/{instance.module.course.id}/modules/{instance.module.id}/contents/{instance.id}"
                
                # Render HTML email template
                try:
                    html_message = render_to_string('emails/content_activated.html', {
                        'user': user,
                        'course': instance.module.course,
                        'module': instance.module,
                        'content': instance,
                        'action': action,
                        'content_url': content_url,
                        'is_subscribed': is_subscribed,
                        'timestamp': timezone.now()
                    })
                except Exception as template_error:
                    logger.warning(f"Template error: {template_error}. Using fallback.")
                    # Fallback HTML
                    content_type_name = instance.content_type.name if instance.content_type else "content"
                    html_message = f"""
                    <html>
                        <body style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>New Content Available!</h2>
                            <p>Hello {user.first_name or user.username},</p>
                            <p>New content <strong>"{instance.title}"</strong> has been {action} in module <strong>"{instance.module.title}"</strong>.</p>
                            <p>Content Type: {content_type_name}</p>
                            <p><a href="{content_url}" style="background-color: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Content</a></p>
                        </body>
                    </html>
                    """
                
                plain_message = strip_tags(html_message)
                
                send_mail(
                    subject=subject,
                    message=plain_message,
                    from_email=from_email,
                    recipient_list=[user.email],
                    html_message=html_message,
                    fail_silently=False
                )
                
                success_count += 1
                logger.info(f"✅ Sent to {user.email}")
                
            except Exception as e:
                logger.error(f"❌ Failed: {str(e)}")
        
        logger.info(f"📊 Content notification ({action}) - Sent: {success_count}")
                    
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
