# PrepMate: A Lesson Planning Tool

#### Video Demo: [https://youtu.be/1Lyw5x0ngw4]

## Project Overview

PrepMate is a lesson planning tool designed for educators teaching Grades PreK through 5. Its purpose is to simplify the process of writing, saving, organizing, searching, and scheduling lessons.

I created PrepMate to solve a problem I faced as a former teacher: I often had to rewrite the same lesson plans year after year because the learning management system (LMS) I was required to use did not allow keyword searching of previous lessons. Accessing a past plan meant scrolling through the previous year’s calendar day by day.

With PrepMate, this problem and many others are solved. Users can create new lesson plans using an intuitive form that organizes all lesson components. Multiple Common Core State Standards can be attached to each lesson, filtered by grade and subject, so users only see the standards they need.

Once a lesson plan is created, it can be searched by keyword and easily added to the calendar with the “Add to Calendar” button—allowing plans to be reused on any day, year after year. Lessons can be rescheduled via drag-and-drop if needed. PrepMate also lets users upload attachments, edit, delete, or update existing plans, and copy plans to save as new.

Finally, PrepMate makes it easy to share lessons: users can print individual lesson plans or the entire monthly calendar for colleagues, eliminating the need for ransacking file cabinets or repeated manual searches.

## Distinctiveness and Complexity

PrepMate stands out among CS50 Web Programming projects due to its unique combination of organizational features, interactive components, and complex data relationships. Unlike simpler projects, PrepMate is a full-featured lesson planning application that supports multiple many-to-many relationships, file attachments, and dynamic interactions between models, all of which are accessed frequently and in different ways.

One of the most technically complex aspects of PrepMate is the edit functionality for LessonPlans. Users can update textual components, add new files, delete existing attachments, or copy a lesson plan to create a new one. Handling these operations required careful management of relational data and file storage, as well as debugging edge cases to prevent the loss of existing data. The logic to simultaneously manage multiple files and relational links pushed the project beyond complexity level of standard CRUD operations.

The calendar feature, implemented using JavaScript’s FullCalendar, adds another layer of complexity. Lessons are represented as separate instances on the calendar, allowing users to reuse a single lesson multiple times without affecting the original data. Users can view, reschedule via drag-and-drop, and delete lessons directly on the calendar. Implementing the drag-and-drop interactions while keeping the backend data consistent involved asynchronous requests, careful event handling, and integration with Django models, which is a combination that is unique from other course projects.

Finally, PrepMate includes an advanced keyword search functionality. Using query parameters and Django’s Q objects, users can filter lessons across multiple fields in real time. Implementing this required optimizing database queries for performance and ensuring that search results accurately reflected the dynamic relationships between lesson plans, standards, and attachments.

Overall, PrepMate’s combination of database complexity, file management, interactive calendar integration, and advanced search functionality demonstrates a level of distinctiveness and technical complexity that sets it apart from typical course projects.

## Setup and Installation
In order to get PrepMate running, follow these steps:
1. Clone the reposition and enter the project folder.
```
git clone https://github.com/paigekmason/prepmate.git
cd prepmate-lesson-planner
```

2. Create and activate a virtual environment.
```
python3 -m venv venv
source venv/bin/activate
```

3. Install the required packages from the requirements.txt file.
```
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

4. Apply migrations and migrate
```
python manage.py makemigrations prepmate
python manage.py migrate
```

5. Run the server
```
python manage.py runserver
```

## Technologies Used
The following technologies were used to implement PrepMate's functionality and styling:
* Django
* Python
* JavaScript (including FullCalendar)
* HTML
* CSS/SCSS
* Bootstrap
* SQL

## File Descriptions
### Python/Backend Files
* `models.py` -- Defines five database models including User, LessonPlan, Attachment, Standard, and LessonInstance.
* `urls.py` -- Maps ten url routes to their corresponding functions in `views.py`.
* `views.py` -- One of the more complex files, containing view functions creating new or editing existing lesson plans, attaching multiple standards and files, searching lesson plans, and compiling calendar event data.
* `tests.py` -- Contains tests for user authorization and the creation, modification, search, and deletion of lesson plans, attachments, standards, and calendar events.
* `apps.py` -- Contains the configuation for the PrepMate app.
* `admin.py` -- Registers the models and customizes the display of standards in the Django admin interface.
* `settings.py` -- Contains project settings including installed apps, database configuration, and media storage.

### Templates
* `index.html` -- The homepage of PrepMate (a single-page application), where all content is displayed after login.
* `layout.html` -- The base layout used across the app, including the navigation bar and header links.
* `login.html` -- Login form for existing users.
* `register.html` -- Registration form for new users.

### Static Files
* `styles.css` -- Compiled from `styles.scss`; includes custom styling for the application.
* `print.css` -- Stylesheet optimized for printing lesson plans and calendar.
* `prepmate.js` -- The longest and one of the more complex files in the project, handling FullCalendar setup, asynchronous requests, lesson plan creating/editing/searching, and DOM manipulation.

### Management and Data Files
* `/management/commands/import_standards.py` -- Custom management command used to import Common Core State Standards from CSV files and create Standard objects.
* `/data/ccss_ela.csv` and `/data/ccss_math.csv` -- CSV files containing Common Core State Standards for ELA and Math from Grades K-12.

### Media
* `prepmate_logo.png` and `intro.mp4` -- Media files used in `layout.html` and `index.html`.
* `media/attachments/` -- Directory that stores user-uploaded lesson attachments.

### Documentation
* `README.md` -- Project documentation describing PrepMate's purpose, functionality, structure, and setup instructions.
* `requirements.txt` -- Lists the python packages required to run the application.

The following files were generated as part of installing FullCalendar and were not manually edited:
* `package.json` and `package-lock.json` describe the JavaScript dependencies used in the project, including the FullCalendar package.
* The `/node_modules` directory contains the installed dependency files required for FullCalendar's functionality.

## Additional Notes
### Known Limitations
* PrepMate is intended for educators teaching Grades PreK through 5.
* Standards are currently provided only for ELA and Mathematics.
* Lesson Plans can only be shared with colleagues via the print feature.
* The calendar does not support time-based scheduling of lessons.

In future versions of this project, I intend to improve upon the following functionality:
* Users will have the option add other users as "friends" to enable automatic sharing of lesson plans, especially among grade-level colleagues.
* Administrators will be able to register administrator-specific accounts to view employee lesson plans and leave feedback.
* Users will be able to create non-lesson calendar events (e.g. assemblies, school closings, field trips).
