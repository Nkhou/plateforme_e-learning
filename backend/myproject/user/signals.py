# user/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import Course, Module, CourseContent, Subscription
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Course)
def send_course_activation_email(sender, instance, created, **kwargs):
    """
    Send email when course status changes to active
    """
    try:
        # Check if course was just activated (status changed to 1)
        if instance.status == 1:  # Course is active
            # Get all active subscribers for this course
            subscriptions = Subscription.objects.filter(
                course=instance, 
                is_active=True
            ).select_related('user')
            
            if subscriptions.exists():
                subject = f"New Course Available: {instance.title_of_course}"
                logger.info(f"Sending course activation emails to {subscriptions.count()} subscribers for course: {instance.title_of_course}")
                
                for subscription in subscriptions:
                    try:
                        html_message = render_to_string('emails/course_activated.html', {
                            'user': subscription.user,
                            'course': instance,
                            'course_url': f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/courses/{instance.id}",
                            'timestamp': timezone.now()
                        })
                        
                        plain_message = strip_tags(html_message)
                        
                        send_mail(
                            subject=subject,
                            message=plain_message,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[subscription.user.email],
                            html_message=html_message,
                            fail_silently=True
                        )
                        logger.info(f"Course activation email sent to {subscription.user.email}")
                    except Exception as e:
                        logger.error(f"Failed to send course activation email to {subscription.user.email}: {str(e)}")
                        
    except Exception as e:
        logger.error(f"Error in course activation signal: {str(e)}")

@receiver(post_save, sender=Module)
def send_module_activation_email(sender, instance, created, **kwargs):
    """
    Send email when module status changes to active
    """
    try:
        if instance.status == 1:  # Module is active
            # Get all active subscribers for the course
            subscriptions = Subscription.objects.filter(
                course=instance.course, 
                is_active=True
            ).select_related('user')
            
            if subscriptions.exists():
                subject = f"New Module Available: {instance.title}"
                logger.info(f"Sending module activation emails to {subscriptions.count()} subscribers for module: {instance.title}")
                
                for subscription in subscriptions:
                    try:
                        html_message = render_to_string('emails/module_activated.html', {
                            'user': subscription.user,
                            'course': instance.course,
                            'module': instance,
                            'course_url': f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/courses/{instance.course.id}/modules/{instance.id}",
                            'timestamp': timezone.now()
                        })
                        
                        plain_message = strip_tags(html_message)
                        
                        send_mail(
                            subject=subject,
                            message=plain_message,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[subscription.user.email],
                            html_message=html_message,
                            fail_silently=True
                        )
                        logger.info(f"Module activation email sent to {subscription.user.email}")
                    except Exception as e:
                        logger.error(f"Failed to send module activation email to {subscription.user.email}: {str(e)}")
                        
    except Exception as e:
        logger.error(f"Error in module activation signal: {str(e)}")

@receiver(post_save, sender=CourseContent)
def send_content_activation_email(sender, instance, created, **kwargs):
    """
    Send email when content is created/updated with active status
    """
    try:
        if instance.status == 1:  # Content is active
            # Get all active subscribers for the course
            subscriptions = Subscription.objects.filter(
                course=instance.module.course, 
                is_active=True
            ).select_related('user')
            
            if subscriptions.exists():
                action = "created" if created else "updated"
                subject = f"New Content Available: {instance.title}"
                logger.info(f"Sending content activation emails to {subscriptions.count()} subscribers for content: {instance.title}")
                
                for subscription in subscriptions:
                    try:
                        html_message = render_to_string('emails/content_activated.html', {
                            'user': subscription.user,
                            'course': instance.module.course,
                            'module': instance.module,
                            'content': instance,
                            'action': action,
                            'content_url': f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/courses/{instance.module.course.id}/modules/{instance.module.id}/contents/{instance.id}",
                            'timestamp': timezone.now()
                        })
                        
                        plain_message = strip_tags(html_message)
                        
                        send_mail(
                            subject=subject,
                            message=plain_message,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[subscription.user.email],
                            html_message=html_message,
                            fail_silently=True
                        )
                        logger.info(f"Content activation email sent to {subscription.user.email}")
                    except Exception as e:
                        logger.error(f"Failed to send content activation email to {subscription.user.email}: {str(e)}")
                        
    except Exception as e:
        logger.error(f"Error in content activation signal: {str(e)}")