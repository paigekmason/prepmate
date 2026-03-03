from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create", views.create_plan, name="create_plan"),
    path("plans/", views.plans, name="plans"),
    path("list_standards/", views.standards_list, name="standards_list"),
    path("calendar_events/", views.calendar_events, name="calendar_events"),
    path("edit_plan/", views.edit_plan, name="edit_plan"),
    path("attachments/", views.attachments, name="attachments")
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
