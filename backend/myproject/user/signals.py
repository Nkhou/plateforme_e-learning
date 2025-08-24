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