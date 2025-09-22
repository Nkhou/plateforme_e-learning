# your_app/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Course
from .serializers import CourseSerializer

@receiver(post_save, sender=Course)
def course_saved(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        serializer = CourseSerializer(instance)
        
        async_to_sync(channel_layer.group_send)(
            f'user_{instance.creator.id}_courses',
            {
                'type': 'course_created',
                'course': serializer.data
            }
        )

@receiver(post_delete, sender=Course)
def course_deleted(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        f'user_{instance.creator.id}_courses',
        {
            'type': 'course_deleted',
            'course_id': instance.id
        }
    )
# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ContentProgress, Enrollment

# courses/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ContentProgress, Enrollment

@receiver(post_save, sender=ContentProgress)
def update_enrollment_progress(sender, instance, created, **kwargs):
    if created or instance.completed:
        enrollment = instance.enrollment
        total_content = enrollment.course.contents.count()
        completed_content = ContentProgress.objects.filter(
            enrollment=enrollment, 
            completed=True
        ).count()
        
        if total_content > 0:
            progress = int((completed_content / total_content) * 100)
            enrollment.progress = progress
            enrollment.completed = (progress == 100)
            enrollment.save()