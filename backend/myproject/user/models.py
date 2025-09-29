from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings

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

# Ajouter le choix de statut
USER_STATUS_CHOICES = [
    (1, 'Actif'),
    (2, 'Suspendu'),
]

class CustomUser(AbstractUser):
    privilege = models.CharField(max_length=10, choices=PRIVILEGE_CHOICES, default='AP')
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default='F')
    status = models.IntegerField(choices=USER_STATUS_CHOICES, default=1)  # Nouveau champ statut
    suspended_at = models.DateTimeField(null=True, blank=True)  # Date de suspension
    suspension_reason = models.TextField(blank=True, null=True)  # Raison de la suspension

    def __str__(self):
        return self.username

    @property
    def is_active_user(self):
        """Vérifie si l'utilisateur est actif"""
        return self.status == 1

    def suspend_user(self, reason=""):
        """Suspendre un utilisateur"""
        self.status = 2
        self.suspended_at = timezone.now()
        self.suspension_reason = reason
        self.save()

    def activate_user(self):
        """Réactiver un utilisateur"""
        self.status = 1
        self.suspended_at = None
        self.suspension_reason = None
        self.save()

# Ajouter le choix de statut pour les cours
COURSE_STATUS_CHOICES = [
    (0, 'Brouillon'),
    (1, 'Actif'),
    (2, 'Archivé'),
]

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
    status = models.IntegerField(choices=COURSE_STATUS_CHOICES, default=0)  # Nouveau champ statut
    subscribers = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        through='Subscription', 
        related_name='subscribed_courses',
        blank=True
    )

    def __str__(self):
        creator_name = self.creator.get_full_name() or self.creator.username
        return f"{self.title_of_course} by {creator_name}"

    @property
    def is_draft(self):
        return self.status == 0

    @property
    def is_active(self):
        return self.status == 1

    @property
    def is_archived(self):
        return self.status == 2

    def activate_course(self):
        """Activer le cours"""
        self.status = 1
        self.save()

    def archive_course(self):
        """Archiver le cours"""
        self.status = 2
        self.save()

    def set_draft(self):
        """Remettre en brouillon"""
        self.status = 0
        self.save()
class Enrollment(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    progress = models.IntegerField(default=0)  # 0-100 percentage
    
    class Meta:
        unique_together = ['user', 'course']
    
    def __str__(self):
        return f"{self.user.username} - {self.course.title_of_course}"

class ContentType(models.Model):
    name = models.CharField(max_length=50)  # 'video', 'qcm', or 'pdf'
    
    def __str__(self):
        return self.name

class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)  # for ordering modules within a course
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.course.title_of_course} - {self.title}"
class CourseContent(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='contents', null=True, blank=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)  # for ordering content within a module
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.content_type}: {self.title}"
class ContentProgress(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='content_progress')
    content = models.ForeignKey(CourseContent, on_delete=models.CASCADE)  # Adjust based on your Content model
    completed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(auto_now_add=True)
    time_spent = models.IntegerField(default=0)  # in seconds
    
    class Meta:
        unique_together = ['enrollment', 'content']
    
    def __str__(self):
        return f"{self.enrollment.user.username} - {self.content.title}"




class QCM(models.Model):
    course_content = models.OneToOneField(CourseContent, on_delete=models.CASCADE, related_name='qcm')
    question = models.TextField()
    points = models.IntegerField(default=1)  
    passing_score = models.IntegerField(default=80) 
    max_attempts = models.IntegerField(default=3)  
    time_limit = models.IntegerField(default=0)  

    def __str__(self):
        return f"QCM: {self.question} ({self.points} points)"

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
        # Get all contents in the same module
        module_contents = CourseContent.objects.filter(module=content.module).order_by('order')
        
        # Find the position of the current content
        content_position = None
        for i, module_content in enumerate(module_contents):
            if module_content.id == content.id:
                content_position = i
                break
        
        # If it's the first content in the module, allow access
        if content_position == 0:
            return True
        
        # Check if previous content is completed
        previous_content = module_contents[content_position - 1]
        
        # If previous content is a QCM, check if it's passed
        if previous_content.content_type.name == 'QCM':
            qcm = previous_content.qcm
            completion = QCMCompletion.objects.filter(
                subscription=self, 
                qcm=qcm, 
                is_passed=True
            ).exists()
            return completion
        
        # For non-QCM content, check if it's marked as completed
        return self.completed_contents.filter(id=previous_content.id).exists()

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

# Signals for creating folders
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