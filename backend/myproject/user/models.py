from django.db import models
from django.contrib.auth.models import AbstractUser
class CustomUser(AbstractUser):
    PRIVILEGE_CHOICES = [
        ('A', 'Admin'),
        ('AP', 'Apprenant'),
        ('F', 'Formateur'),
    ]

    FirstName = models.CharField(max_length=50)
    LastName = models.CharField(max_length=50)
    Privilege = models.CharField(max_length=10, choices=PRIVILEGE_CHOICES, default='AP')

    def __str__(self):
      return self.username


class Course(models.Model):
    creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    pdf_file = models.FileField(upload_to='pdfs/')
    video_file = models.FileField(upload_to='videos/')

    def __str__(self):
        return f"Course by {self.creator.FirstName}"
