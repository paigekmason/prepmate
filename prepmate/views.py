import os
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_exempt
from . models import User, LessonPlan, Standard, Attachment, LessonInstance


def index(request):
    return render(request, 'index.html')


def login_view(request):
    if request.method == "POST":

        # Attempt user sign in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check for successful authentication
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, 'login.html', {
                "message": "Invalid username and/or password."
            })

    else:
        return render(request, "login.html")


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Confirm password and confirmation match
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, 'register.html', {
                "message": "Passwords must match."
            })

        if not username or not email or not password:
            return render(request, 'register.html', {
                "message": "Please input all required fields."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, 'register.html', {
                "message": "Username is already in use. Select a new one."
            })
        login(request, user)
        return HttpResponseRedirect(reverse('index'))
    else:
        return render(request, 'register.html')


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


@login_required
def create_plan(request):

    if not request.user.is_authenticated:
        return JsonResponse({
            "success": False,
            "error": "Login required to create new lesson plan."},
            status=401)

    if request.method == "POST":
        title = request.POST.get("lesson-title")
        objective = request.POST.get("objective")
        activator = request.POST.get("activator")
        teaching = request.POST.get("teaching")
        summarizer = request.POST.get("summarizer")
        subject = request.POST.get("subject")
        grade = request.POST.get("grade")
        date = request.POST.get("date")
        notes = request.POST.get("notes")
        files = request.FILES.getlist("files")

        standards_ids = request.POST.getlist("standard_options")

        print("Posted standards ids: ", standards_ids)

        new_lesson = LessonPlan.objects.create(
            creator=request.user,
            title=title,
            objective=objective,
            activator=activator,
            teaching=teaching,
            summarizer=summarizer,
            subject=subject,
            grade=grade,
            notes=notes
        )

        if date:
            LessonInstance.objects.create(
                lesson=new_lesson,
                date=date
            )

        for file in files:
            Attachment.objects.create(
                lesson=new_lesson,
                file=file
            )

        print("Lesson created: ", new_lesson.title)

        if standards_ids:
            selection = Standard.objects.filter(id__in=standards_ids)
            new_lesson.standards.set(selection)

        else:
            print("No standards submitted.")

        return HttpResponseRedirect(reverse('index'))

# Temporary: remove before production


@csrf_exempt
@login_required
def edit_plan(request):

    # Grab form data
    lesson_id = request.POST.get("lesson_id")  # None for "save as new"
    title = request.POST.get("title")
    grade = request.POST.get("grade")
    objective = request.POST.get("objective")
    activator = request.POST.get("activator")
    teaching = request.POST.get("teaching")
    summarizer = request.POST.get("summarizer")
    notes = request.POST.get("notes")
    subject = request.POST.get("subject")

    # Get existing attachments (as integers, filter invalid)
    existing_attachments = [
        int(id) for id in request.POST.getlist("existing_attachments[]") if id.isdigit()
    ]

    # New files uploaded
    new_attachments = request.FILES.getlist("new_attachments[]")

    # Standards array
    standards_ids = [int(sid) for sid in request.POST.getlist("standards[]") if sid.isdigit()]

    # Save as new lesson
    if not lesson_id:
        # Create the new lesson instance
        new_lesson = LessonPlan.objects.create(
            creator=request.user,
            grade=grade,
            title=title,
            subject=subject,
            objective=objective,
            activator=activator,
            teaching=teaching,
            summarizer=summarizer,
            notes=notes
        )

        # ----- CLONE EXISTING ATTACHMENTS -----
        for attachment_id in existing_attachments:
            try:
                old_attachment = Attachment.objects.get(
                    id=attachment_id, lesson__creator=request.user)
            except Attachment.DoesNotExist:
                continue

            old_file = old_attachment.file

            # Open file in binary mode
            old_file.open('rb')
            file_content = old_file.read()
            old_file.close()

            # Give it a unique name for the new lesson
            filename = os.path.basename(old_file.name)

            # Create new attachment with new file
            Attachment.objects.create(
                lesson=new_lesson,
                file=ContentFile(file_content, name=filename)
            )

            # Save newly uploaded files
        for uploaded_file in new_attachments:
            Attachment.objects.create(
                lesson=new_lesson,
                file=uploaded_file
            )

        # Save standards
        if standards_ids:
            selection = Standard.objects.filter(id__in=standards_ids)
            new_lesson.standards.set(selection)

        return JsonResponse({
            "success": True,
            "message": "Successfully created new lesson."},
            status=201)

    # If replacing existing lesson, update the lesson with that id
    else:

        lesson = LessonPlan.objects.get(id=lesson_id, creator=request.user)

        lesson.title = request.POST.get("title")
        lesson.objective = request.POST.get("objective")
        lesson.activator = request.POST.get("activator")
        lesson.teaching = request.POST.get("teaching")
        lesson.summarizer = request.POST.get("summarizer")
        lesson.notes = request.POST.get("notes")
        lesson.subject = request.POST.get("subject")
        lesson.standards.set(request.POST.getlist("standards[]"))
        lesson.save()

        for file in request.FILES.getlist("new_attachments[]"):
            Attachment.objects.create(
                lesson=lesson,
                file=file
            )

        return JsonResponse({
            "success": True,
            "message": "Successfully updated lesson."},
            status=200)


@csrf_exempt
@login_required
def attachments(request):

    if request.method == 'POST':
        attachment_id = request.POST.get("attachment_id")
        try:
            Attachment.objects.get(id=attachment_id, lesson__creator=request.user).delete()
            return JsonResponse({
                "success": True,
                "message": "Attachment successfully removed from lesson."},
                status=200)
        except Attachment.DoesNotExist:
            return JsonResponse({
                "success": False,
                "error": "Attachment not found."},
                status=404)


@csrf_exempt
@login_required
def plans(request):
    lesson_id = request.GET.get('id', None)

    if lesson_id:
        # POST method in this route is only used for deleting lessons
        if request.method == "POST":
            lesson = LessonPlan.objects.get(id=lesson_id, creator=request.user)
            lesson.delete()
            return HttpResponseRedirect(reverse('index'))

        # If not deleting, GET method with a lesson_id provides lesson context for view lesson page
        try:
            lesson = LessonPlan.objects.get(id=lesson_id, creator=request.user)
            data = {
                'id': lesson.id,
                'title': lesson.title,
                'grade': lesson.grade,
                'subject': lesson.subject,
                'objective': lesson.objective,
                'activator': lesson.activator,
                'teaching': lesson.teaching,
                'notes': lesson.notes,
                'summarizer': lesson.summarizer,
                'standards': [
                    {'id': standard.id, 'code': standard.code, 'description': standard.description}
                    for standard in lesson.standards.all()
                ],
                'attachments': [
                    {'id': attachment.id,
                     'name': attachment.file.name.split("/")[-1],
                     'url': attachment.file.url}
                    for attachment in lesson.attachments.all()
                ]
            }
            return JsonResponse(data)
        except LessonPlan.DoesNotExist:
            return JsonResponse({
                "success": False,
                "error": "LessonPlan not found"},
                status=404)

    # Get lesson plans for this user only
    queryset = LessonPlan.objects.filter(creator=request.user).order_by("-created_on")

    # Get query from search input
    query = request.GET.get('q')

    # Adjust queryset based on search parameters
    if query:
        queryset = queryset.filter(Q(title__icontains=query) | Q(
            objective__icontains=query) | Q(teaching__icontains=query))

    # Instantiate paginator (display 5 lessons per page)
    paginator = Paginator(queryset, 5)
    current_page = paginator.get_page(request.GET.get('page', 1))

    results = [
        {
            'id': lesson.id,
            'title': lesson.title,
            'objective': lesson.objective,
            'grade': lesson.grade,
            'subject': lesson.subject,
            'standards': [
                {'id': s.id, 'code': s.code, 'description': s.description}
                for s in lesson.standards.all()
            ],
            'attachments': [
                {'id': attachment.id, 'name': attachment.file.name.split(
                    "/")[-1], 'url': attachment.file.url}
                for attachment in lesson.attachments.all()
            ]
        }
        for lesson in current_page.object_list
    ]

    # Manually return items if only one page
    if paginator.count == 0:
        return JsonResponse({
            'count': 0,
            'num_pages': 0,
            'current_page': 1,
            'next_page': None,
            'previous_page': None,
            'results': []
        })

    # Pass paginator information
    data = {
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': current_page.number,
        'next_page': current_page.next_page_number() if current_page.has_next() else None,
        'previous_page': current_page.previous_page_number() if current_page.has_previous() else None,
        'results': results
    }

    return JsonResponse(data)


# Return list of standards filtered by content and grade
def standards_list(request):
    selected_content_type = request.GET.get('content_type')
    selected_grade = request.GET.get('grade_id')

    queryset = Standard.objects.all()

    if selected_content_type:
        queryset = queryset.filter(content_type=selected_content_type)

    if selected_grade:
        queryset = queryset.filter(grade_id=selected_grade)

    data = [standard.serialize() for standard in queryset]

    return JsonResponse(data, safe=False)


@csrf_exempt
@login_required
def calendar_events(request):

    # POST method used to change event date, delete event, or create new

    if request.method == "POST":

        lesson_id = request.POST.get("lesson_id")
        date = request.POST.get("date") if request.POST.get("date") else None
        old_date = parse_datetime(request.POST.get(
            "old_date")) if request.POST.get("old_date") else None
        new_date = parse_datetime(request.POST.get(
            "new_date")) if request.POST.get("new_date") else None
        remove = request.POST.get("remove")

        # Change date of existing instance on drag and drop
        if (new_date):
            try:
                instance = LessonInstance.objects.get(lesson=LessonPlan.objects.get(
                    id=lesson_id, creator=request.user), date=old_date)
                instance.date = new_date
                instance.save()
                return JsonResponse({
                    "success": True,
                    "message": "Date changed."},
                    status=200)

            except LessonInstance.DoesNotExist:
                return JsonResponse({
                    "success": False,
                    "error": "Lesson instance not found."},
                    status=404)

        # Remove is true only when user drags event to trash
        elif (remove):
            try:
                instance = LessonInstance.objects.get(lesson=LessonPlan.objects.get(
                    id=lesson_id, creator=request.user), date=parse_datetime(date))
                instance.delete()
                return JsonResponse({
                    "success": True,
                    "message": "Lesson removed from calendar."},
                    status=200)
            except LessonInstance.DoesNotExist:
                return JsonResponse({
                    "success": False,
                    "error": "Lesson instance not found."},
                    status=404)

        # If not remove and not new date given, user creates a new lesson instance (event)
        else:

            # Add a new lesson instance
            try:
                LessonInstance.objects.create(
                    lesson=LessonPlan.objects.get(id=lesson_id, creator=request.user),
                    date=date
                )
                return JsonResponse({
                    "success": True,
                    "message": "Added to calendar."},
                    status=201)

            except LessonPlan.DoesNotExist:
                return JsonResponse({
                    "success": False,
                    "error": "Lesson Plan not found."},
                    status=404)

    # Add lesson instances to calendar via GET
    else:
        lesson_instances = LessonInstance.objects.filter(lesson__creator=request.user)

        # Events colored by subject
        color_map = {
            "MATH.CONTENT": '#BDDBDD',
            "ELA-LITERACY": '#F3DA65',
            "Science": '#2F895B',
            "Social-Studies": '#FFA47D',
            "SEL": '#F7CDD0'
        }

        # Create list of events to append to calendar
        events = []
        for instance in lesson_instances:
            events.append({
                "id": instance.lesson.id,
                "title": instance.lesson.title,
                "subject": instance.lesson.subject,
                "start": instance.date,
                "color": color_map.get(instance.lesson.subject, "#999")
            })

        return JsonResponse(events, safe=False)
