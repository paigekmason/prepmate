from django.contrib import admin
from .models import User, LessonPlan, Attachment, Standard, LessonInstance


class StandardsAdmin(admin.ModelAdmin):
    filter_horizontal = ("standards", )


admin.site.register(User)
admin.site.register(LessonPlan, StandardsAdmin)
admin.site.register(Attachment)
admin.site.register(Standard)
admin.site.register(LessonInstance)
