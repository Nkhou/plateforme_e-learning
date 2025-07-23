from django.db import models

class CustomUser(models.Model):
    PRIVILEGE_CHOICES = [
        ('A', 'Admin'),
        ('AP', 'Apprenant'),
        ('F', 'Formateur'),
    ]

    FirstName = models.CharField(max_length=50)
    LastName = models.CharField(max_length=50)
    email = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=100)
    Privilege = models.CharField(max_length=10, choices=PRIVILEGE_CHOICES, default='AP')

    def __str__(self):
        return f"{self.FirstName} {self.LastName}"


class Course(models.Model):
    creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    pdf_file = models.FileField(upload_to='pdfs/')
    video_file = models.FileField(upload_to='videos/')

    def __str__(self):
        return f"Course by {self.creator.FirstName}"
