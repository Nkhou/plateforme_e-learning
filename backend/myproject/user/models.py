from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings

class CustomUser(AbstractUser):
    PRIVILEGE_CHOICES = [
        ('A', 'Admin'),
        ('AP', 'Apprenant'),
        ('F', 'Formateur'),
    ]
    Privilege = models.CharField(max_length=10, choices=PRIVILEGE_CHOICES, default='AP')

    def __str__(self):
      return self.username


# Use the CustomUser class defined above

class Course(models.Model):
    title_of_course = models.CharField(max_length=100, blank=False, null=False)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(
        upload_to='course_images/',
        null=True,  # Allow null in database
        blank=True,  # Allow blank in forms
        max_length=100  # Match the VARCHAR(100) constraint
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,  # Use CASCADE instead of SET_NULL if creator is required
        related_name='created_courses'
    )    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    subscribers = models.ManyToManyField(CustomUser, through='Subscription', related_name='subscribed_courses',blank=True)

    def __str__(self):
        return f"{self.title_of_course} by {self.creator.first_name}"

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
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.content_type}: {self.title}"
class QCM(models.Model):
    course_content = models.OneToOneField(CourseContent, on_delete=models.CASCADE, related_name='qcm')
    question = models.TextField()
    points = models.IntegerField(default=1)  # Points for this QCM
    passing_score = models.IntegerField(default=80)  # Minimum percentage to pass
    max_attempts = models.IntegerField(default=3)  # Maximum attempts allowed
    time_limit = models.IntegerField(default=0)  # Time limit in minutes (0 = no limit)

    def __str__(self):
        return f"QCM: {self.question} ({self.points} points)"
class Subscription(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='course_subscriptions')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_subscriptions')
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    # Progress tracking
    total_score = models.IntegerField(default=0)  # Total points earned
    completed_qcms = models.ManyToManyField(QCM, through='QCMCompletion', blank=True)
    locked_contents = models.ManyToManyField('CourseContent', blank=True, related_name='locked_for_users')
    
    def update_total_score(self):
        completed_qcms = QCMCompletion.objects.filter(subscription=self, is_passed=True)
        self.total_score = sum(completion.points_earned for completion in completed_qcms)
        self.save()
        return self.total_score
    
    def can_access_content(self, content):
        """Check if user can access specific content based on prerequisites"""
        if content.order == 1:  # First content is always accessible
            return True
        
        # Check if previous content is completed
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
    
    def __str__(self):
        return self.course_content.title

class PDFContent(models.Model):
    course_content = models.OneToOneField(CourseContent, on_delete=models.CASCADE, related_name='pdf_content')
    pdf_file = models.FileField(upload_to='pdfs/')
    
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