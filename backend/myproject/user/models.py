from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings
PRIVILEGE_CHOICES = [
    ('A', 'Admin'),
    ('AP', 'Apprenant'),
    ('F', 'Formateur'),
]

DEPARTMENT_CHOICES = [
    ('F', 'FINANCE'),
    ('H', 'Human RESOURCES'),
    ('M', 'MARKETING'),
    ('O', 'OPERATIONS/PRODUCTION'),
    ('S', 'Sales'),
]

class CustomUser(AbstractUser):
    privilege = models.CharField(max_length=10, choices=PRIVILEGE_CHOICES, default='AP')
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default='F')

    def __str__(self):
        return self.username

class Course(models.Model):
    title_of_course = models.CharField(max_length=100, blank=False, null=False)
    description = models.TextField(blank=True, null=True)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default='F')
    image = models.ImageField(
        upload_to='course_images/',
        null=True, 
        blank=True,
        max_length=100  
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_courses'
    )    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    subscribers = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        through='Subscription', 
        related_name='subscribed_courses',
        blank=True
    )

    def __str__(self):
        # More robust string representation
        creator_name = self.creator.get_full_name() or self.creator.username
        return f"{self.title_of_course} by {creator_name}"
class ContentType(models.Model):
    name = models.CharField(max_length=50)  # 'video' or 'qcm'
    
    def __str__(self):
        return self.name
class CourseContent(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='contents')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)  # for ordering content
    is_completed = models.BooleanField(default=False)
    
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.content_type}: {self.title}"
class QCM(models.Model):
    course_content = models.OneToOneField(CourseContent, on_delete=models.CASCADE, related_name='qcm')
    question = models.TextField()
    points = models.IntegerField(default=1)  
    passing_score = models.IntegerField(default=80) 
    max_attempts = models.IntegerField(default=3)  
    time_limit = models.IntegerField(default=0)  

    def __str__(self):
        return f"QCM: {self.question} ({self.points} points)"
class Subscription(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='course_subscriptions')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_subscriptions')
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    total_score = models.IntegerField(default=0) 
    completed_contents = models.ManyToManyField('CourseContent', blank=True, related_name='completed_by_users') 
    completed_qcms = models.ManyToManyField(QCM, through='QCMCompletion', blank=True)
    locked_contents = models.ManyToManyField('CourseContent', blank=True, related_name='locked_for_users')
    
    progress_percentage = models.FloatField(default=0.0)
    
    def update_total_score(self):
        completed_qcms = QCMCompletion.objects.filter(subscription=self, is_passed=True)
        self.total_score = sum(completion.points_earned for completion in completed_qcms)
        self.save()
        return self.total_score
    
    def can_access_content(self, content):
        """Check if user can access specific content based on prerequisites"""
        if content.order == 1:  
            return True
        
        previous_content = CourseContent.objects.filter(
            course=content.course, 
            order=content.order - 1
        ).first()
        
        if previous_content and previous_content.content_type.name == 'QCM':
            qcm = previous_content.qcm
            completion = QCMCompletion.objects.filter(
                subscription=self, 
                qcm=qcm, 
                is_passed=True
            ).exists()
            return completion
        
        return True
class QCMCompletion(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE)
    qcm = models.ForeignKey(QCM, on_delete=models.CASCADE)
    best_score = models.FloatField(default=0)
    points_earned = models.IntegerField(default=0)
    is_passed = models.BooleanField(default=False)
    attempts_count = models.IntegerField(default=0)
    last_attempt = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['subscription', 'qcm']



class VideoContent(models.Model):
    course_content = models.OneToOneField(CourseContent, on_delete=models.CASCADE, related_name='video_content')
    video_file = models.FileField(upload_to='videos/%y')
    # is_completed = models.BooleanField(default=False)  # Fixed: default=False
    
    def __str__(self):
        return self.course_content.title

class PDFContent(models.Model):
    course_content = models.OneToOneField(CourseContent, on_delete=models.CASCADE, related_name='pdf_content')
    pdf_file = models.FileField(upload_to='pdfs/')
    # is_completed = models.BooleanField(default=False)  # Fixed: default=False
    
    def __str__(self):
        return self.course_content.title



class QCMOption(models.Model):
    qcm = models.ForeignKey(QCM, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

class QCMAttempt(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='qcm_attempts')
    qcm = models.ForeignKey(QCM, on_delete=models.CASCADE, related_name='attempts')
    selected_options = models.ManyToManyField(QCMOption)
    score = models.FloatField(default=0)  # Percentage score
    points_earned = models.IntegerField(default=0)  # Actual points earned
    is_passed = models.BooleanField(default=False)
    attempt_number = models.IntegerField(default=1)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken = models.IntegerField(default=0)  # Time taken in seconds

    class Meta:
        unique_together = ['user', 'qcm', 'attempt_number']
    
    def calculate_score(self):
        correct_options = self.qcm.options.filter(is_correct=True)
        selected_correct = self.selected_options.filter(is_correct=True).count()
        total_correct = correct_options.count()
        
        if total_correct > 0:
            self.score = (selected_correct / total_correct) * 100
            self.is_passed = self.score >= self.qcm.passing_score
            self.points_earned = self.qcm.points if self.is_passed else 0
        else:
            self.score = 0
            self.is_passed = False
            self.points_earned = 0
        
        self.save()
        return self.score

# Add this to your models.py
from django.db.models.signals import pre_save
from django.dispatch import receiver
import os

@receiver(pre_save, sender=Course)
def create_course_image_folder(sender, instance, **kwargs):
    if instance.id:
        folder_path = os.path.join(settings.MEDIA_ROOT, 'course_images', f'course_{instance.id}')
        os.makedirs(folder_path, exist_ok=True)

@receiver(pre_save, sender=VideoContent)
def create_video_folder(sender, instance, **kwargs):
    folder_path = os.path.join(settings.MEDIA_ROOT, 'videos', timezone.now().strftime('%y/%m/%d'))
    os.makedirs(folder_path, exist_ok=True)

@receiver(pre_save, sender=PDFContent)
def create_pdf_folder(sender, instance, **kwargs):
    folder_path = os.path.join(settings.MEDIA_ROOT, 'pdfs', timezone.now().strftime('%y/%m/%d'))
    os.makedirs(folder_path, exist_ok=True)