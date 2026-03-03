from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime
from .models import LessonPlan, LessonInstance, Attachment, Standard
import json

User = get_user_model()


class PrepMateTests(TestCase):

    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username="paige", email="paige@test.com", password="testpass")
        self.client = Client()
        self.client.login(username="paige", password="testpass")

        # Test creating new standard
        self.standard = Standard.objects.create(code="STD-1", description="Test Standard")

    # Test creating new lesson plan
    def test_create_lesson_plan(self):
        response = self.client.post(
            reverse("create_plan"),
            {
                "lesson-title": "Phonics Fun",
                "objective": "Test objective",
                "activator": "Test activator",
                "teaching": "Test teaching",
                "summarizer": "Test summarizer",
                "subject": "ELA-LITERACY",
                "grade": "3",
                "date": "2026-02-05",
                "notes": "Test notes",
                "standard_options": [self.standard.id],
            }
        )

        # status code 302 for HttpResponseRedirect
        self.assertEqual(response.status_code, 302)
        lesson = LessonPlan.objects.get(title="Phonics Fun")
        self.assertEqual(lesson.creator, self.user)
        self.assertIn(self.standard, lesson.standards.all())

   # Test lesson plan list and search feature (cannot see other users lessons)
    def test_user_only_sees_their_lessons_and_search_works(self):
        other_user = User.objects.create_user(
            username="other", email="other@test.com", password="pass")
        LessonPlan.objects.create(title="User", creator=self.user)
        LessonPlan.objects.create(title="Other", creator=other_user)

        # No search
        response = self.client.get(reverse("plans"))
        data = response.json()
        titles = [lesson["title"] for lesson in data["results"]]
        self.assertIn("User", titles)
        self.assertNotIn("Other", titles)

        # Search
        response = self.client.get(reverse("plans") + "?q=User")
        data = response.json()
        titles = [lesson["title"] for lesson in data["results"]]
        self.assertIn("User", titles)

    # Test update lesson plan
    def test_edit_existing_lesson_plan(self):
        lesson = LessonPlan.objects.create(title="Old Title", creator=self.user)
        response = self.client.post(
            reverse("edit_plan"),
            {
                "lesson_id": lesson.id,
                "title": "New Title",
                "objective": "Objective text",
                "activator": "Activator text",
                "teaching": "Teaching text",
                "summarizer": "Summarizer text",
                "notes": "Some notes",
                "subject": "Science",
                "standards[]": [self.standard.id]
            }
        )
        self.assertEqual(response.status_code, 200)
        lesson.refresh_from_db()
        self.assertEqual(lesson.title, "New Title")
        self.assertIn(self.standard, lesson.standards.all())

    # Test lesson plan deletion
    def test_delete_lesson_plan(self):
        lesson = LessonPlan.objects.create(title="To Delete", creator=self.user)
        # Append lesson id to end of url
        response = self.client.post(reverse("plans") + f"?id={lesson.id}")

        # POST returns 302 because of redirect
        self.assertEqual(response.status_code, 302)

        # Refresh and check deletion
        self.assertFalse(LessonPlan.objects.filter(title="To Delete").exists())

    # Test drag and drop feature on calendar

    def test_calendar_drag_drop_updates_date(self):
        lesson = LessonPlan.objects.create(title="Drag Test", creator=self.user)
        instance = LessonInstance.objects.create(
            lesson=lesson,
            date=timezone.make_aware(datetime(2026, 2, 1, 10, 0))
        )

        # Post method for changing dates
        response = self.client.post(
            reverse("calendar_events"),
            data={
                "lesson_id": lesson.id,
                "old_date": "2026-02-01T10:00:00",
                "new_date": "2026-02-10T10:00:00"
            }
        )

        self.assertEqual(response.status_code, 200)
        instance.refresh_from_db()
        self.assertEqual(instance.date.day, 10)

    # Test adding to calendar
    def test_calendar_add_new_event(self):
        lesson = LessonPlan.objects.create(title="New Event", creator=self.user)
        response = self.client.post(
            reverse("calendar_events"),
            data={"lesson_id": lesson.id, "date": "2026-02-20"}
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(LessonInstance.objects.filter(lesson=lesson, date__day=20).exists())

    # Test deleting attachment
    def test_attachment_delete(self):
        lesson = LessonPlan.objects.create(title="Attach Test", creator=self.user)
        attachment = Attachment.objects.create(lesson=lesson, file="fakefile.txt")
        response = self.client.post(reverse("attachments"), {"attachment_id": attachment.id})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Attachment.objects.filter(id=attachment.id).exists())

    # Test anonymous user redirected to login page
    def test_anonymous_redirect(self):
        self.client.logout()
        response = self.client.post(reverse("create_plan"), {"lesson-title": "Anonymous Test"})
        self.assertEqual(response.status_code, 302)
