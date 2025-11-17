# user/management/commands/test_templates.py
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from user.models import Course, Module, CourseContent, CustomUser
from django.utils import timezone

class Command(BaseCommand):
    help = 'Test email templates'

    def handle(self, *args, **options):
        try:
            # Get test data
            user = CustomUser.objects.first()
            course = Course.objects.first()
            
            self.stdout.write('Testing templates...\n')
            
            # Test course_activated.html
            try:
                html = render_to_string('emails/course_activated.html', {
                    'user': user,
                    'course': course,
                    'course_url': 'http://localhost:3000/courses/1',
                    'is_subscribed': False,
                    'timestamp': timezone.now()
                })
                self.stdout.write(self.style.SUCCESS('✅ course_activated.html - OK'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ course_activated.html - FAILED: {e}'))
            
            # Test module_activated.html
            if course.modules.exists():
                module = course.modules.first()
                try:
                    html = render_to_string('emails/module_activated.html', {
                        'user': user,
                        'course': course,
                        'module': module,
                        'module_url': 'http://localhost:3000/courses/1/modules/1',
                        'is_subscribed': False,
                        'timestamp': timezone.now()
                    })
                    self.stdout.write(self.style.SUCCESS('✅ module_activated.html - OK'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'❌ module_activated.html - FAILED: {e}'))
            
            # Test content_activated.html
            if CourseContent.objects.exists():
                content = CourseContent.objects.first()
                try:
                    html = render_to_string('emails/content_activated.html', {
                        'user': user,
                        'course': content.module.course,
                        'module': content.module,
                        'content': content,
                        'action': 'added',
                        'content_url': 'http://localhost:3000/courses/1/modules/1/contents/1',
                        'is_subscribed': False,
                        'timestamp': timezone.now()
                    })
                    self.stdout.write(self.style.SUCCESS('✅ content_activated.html - OK'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'❌ content_activated.html - FAILED: {e}'))
            
            self.stdout.write('\n' + self.style.SUCCESS('Template test completed!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Test failed: {e}'))