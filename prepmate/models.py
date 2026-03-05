from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models


class User(AbstractUser):
    pass


class LessonPlan(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_plans")
    title = models.TextField(blank=True, null=True)
    objective = models.TextField(blank=True, null=True)
    activator = models.TextField(blank=True, null=True)
    teaching = models.TextField(blank=True, null=True)
    summarizer = models.TextField(blank=True, null=True)
    subject = models.TextField(blank=True, null=True)
    grade = models.CharField(max_length=2, blank=True, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    standards = models.ManyToManyField("Standard", blank=True, related_name="lessons")
    notes = models.TextField(blank=True, null=True, default="")

    def __str__(self):
        return (f"{self.creator} created plan: {self.title} on {self.created_on}")

    def serialize(self, current_user=None):
        return {
            "lesson_id": self.id,
            "creator": self.creator.username,
            "title": self.title,
            "objective": self.objective,
            "activator": self.activator,
            "teaching": self.teaching,
            "summarizer": self.summarizer,
            "notes": self.notes,
            "standards": self.standards,
            "is_creator": self.creator == current_user,
            "lesson_date": self.date.isoformat() if self.date else None,
            "created_on": self.created_on.isoformat() if self.created_on else None
        }


class LessonInstance(models.Model):
    lesson = models.ForeignKey(LessonPlan, on_delete=models.CASCADE, related_name="instances")
    date = models.DateField(blank=True, null=True)

    def __str__(self):
        return (f"{self.lesson.title} scheduled for {self.date}")


class Attachment(models.Model):
    lesson = models.ForeignKey(LessonPlan, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(
        upload_to="attachments/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx', 'ppt', 'pptx'])])

    def clean(self):
        if not self.file:
            raise ValidationError("You must provide a file.")

    def __str__(self):
        return (f"Attachment(s) added to: Lesson {self.lesson}: {self.lesson.title}")

    def serialize(self):
        return {
            "lesson_id": self.lesson.id if self.lesson else None,
            "file": self.file.url if self.file else None,
        }


class Standard(models.Model):
    code = models.CharField(max_length=36, unique=True, blank=True, null=True)
    content_type = models.CharField(max_length=20, blank=True, null=True)
    category_id = models.CharField(max_length=8, blank=True, null=True)
    category_name = models.CharField(max_length=64, blank=True, null=True)
    grade_id = models.CharField(max_length=8, blank=True, null=True)
    grade_name = models.CharField(max_length=16, blank=True, null=True)
    item = models.CharField(max_length=8, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return (f"Grade {self.grade_id} {self.content_type}: {self.description} ({self.code})")

    def serialize(self):
        return {
            "id": self.id,
            "code": self.code,
            "grade": self.grade_id,
            "subject": self.content_type,
            "description": self.description
        }
