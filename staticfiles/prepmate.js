document.addEventListener('DOMContentLoaded', () => {

    console.log('PREPMATE JS Loaded');

    // Define views from index.html
    const listView = document.querySelector('#list-view');
    const createPlanView = document.querySelector('#create-plan');
    const editPlanView = document.querySelector('#edit-plan');
    const calendarView = document.querySelector('#calendar-view');
    const lessonView = document.querySelector('#lesson-view');
    const pagination = document.querySelector('#pagination');
    const pageTitle = document.querySelector('#title');
    const printBtnDiv = document.querySelector('#print-btn-div');
    const searchDiv = document.querySelector('#search-form-view');


    let standardsLookup = {};
    let preselectedStandards = [];

    // Initialize FullCalendar
    var calendarEl = document.getElementById('calendar');
    var trashEl = document.getElementById('trash');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        editable: true,
        events: '/calendar_events/',
        eventClick: function(info) {
            view_lesson(info.event.id);
        },
        eventDrop: function(info) {
            change_date(info.event.id, info.oldEvent.start, info.event.start);
        },
        eventDragStart: function() {
            trashEl.style.display = 'block';
        },
        eventDragStop: function(info) {
            let mouseLeft = info.jsEvent.clientX;
            let mouseTop = info.jsEvent.clientY;
            let trashArea = trashEl.getBoundingClientRect();

            let overTrash = (mouseLeft >= trashArea.left && mouseLeft <= trashArea.right &&
                mouseTop >= trashArea.top && mouseTop <= trashArea.bottom);
            // Check if mouse is over the trash bin
            if (overTrash) {
                // Remove the event from the calendar
                info.event.remove();
                delete_event(info.event.id, info.event.start);
            }
            trashEl.style.display = 'none';
        }
    });
    calendar.render();

    // Initialize Bootstrap modal objects
    const standardsModalEdit = new bootstrap.Modal(document.getElementById('standards-modal-edit'));
    const standardsModalCreate = new bootstrap.Modal(document.getElementById('standards-modal-create'));
    const addToCalendarModal = new bootstrap.Modal(document.getElementById('add-to-calendar-modal'));

    // On load, show calendar and hide other views
    listView.style.display = 'none';
    searchDiv.style.display = 'none';
    pagination.style.display = 'none';
    createPlanView.style.display = 'none';
    editPlanView.style.display = 'none';
    lessonView.style.display = 'none';
    calendarView.style.display = 'block';
    pageTitle.style.display = 'block';
    printBtnDiv.style.display = 'block';

    // By default, show calendar
    view_calendar();

    // Add event listener for lesson view add to calendar button
    const lessonViewAddToCalendarBtn = document.querySelector('#lesson-view-add-to-calendar-btn');
    lessonViewAddToCalendarBtn.addEventListener('click', (event) => {
        const lessonId = lessonViewAddToCalendarBtn.dataset.lessonId;
        const lessonTitle = document.querySelector('#title-lesson-view').innerText;
        let modalTitle = document.querySelector('#lesson-to-schedule');
        modalTitle.innerText = lessonTitle;
        modalTitle.dataset.id = lessonId;
        addToCalendarModal.show();
    });

    // Define standards modal body and title in create view
    const standardsModalBodyCreate = document.querySelector('#standards-modal-body-create');
    const standardsModalTitleCreate = document.querySelector('#standards-modal-title-create');

    // Define standards modal body and title in edit view
    const standardsModalBodyEdit = document.querySelector('#standards-modal-body-edit');
    const standardsModalTitleEdit = document.querySelector('#standards-modal-title-edit');

    const lessonViewEditBtn = document.querySelector('#lesson-view-edit-btn');

    // Add checkbox change listeners for each modal body
    document.querySelectorAll('.modal-body').forEach(modalBody => {
        modalBody.addEventListener('change', (event) => {
            if (event.target.name !== 'standard_options') {
                return;
            }

            const value = event.target.value;

            if (event.target.checked) {
                if (!preselectedStandards.includes(value)) preselectedStandards.push(value);
            } else {
                preselectedStandards = preselectedStandards.filter(id => id !== value);
            }

            // Update the selected standards display div
            const context = modalBody === standardsModalBodyCreate ? 'create' : 'edit';
            update_selected_standards_div(context);
        });
    });

    // Clear previous filtered standards on page load
    standardsModalBodyEdit.innerText = '';
    standardsModalBodyCreate.innerText = '';
    standardsModalTitleEdit.innerText = '';
    standardsModalBodyCreate.innerText = '';

    // Define navigation options
    const myPlansBtn = document.querySelector('#my-plans-nav');
    const createNewBtn = document.querySelector('#create-lesson-nav');
    const calendarBtn = document.querySelector('#calendar-nav');

    // Event handler for my plans option in nav bar
    myPlansBtn.addEventListener('click', (event) => {
        event.preventDefault();
        list_plans(1);
    });

    // Event handler for create new plan option in nav bar
    createNewBtn.addEventListener('click', (event) => {
        event.preventDefault();
        pagination.style.display = 'none';
        listView.style.display = 'none';
        editPlanView.style.display = 'none';
        calendarView.style.display = 'none';
        lessonView.style.display = 'none';
        printBtnDiv.style.display = 'none';
        searchDiv.style.display = 'none';
        createPlanView.style.display = 'block';
        pageTitle.innerText = 'Create New Lesson Plan';
    });

    // Event handler for clicking calendar nav
    calendarBtn.addEventListener('click', (event) => {
        event.preventDefault();
        view_calendar();
    });

    // Event handler for displaying standards list when creating new lesson
    const attachStandardsBtnCreate = document.querySelector('#attach-standards-btn-create');
    attachStandardsBtnCreate.addEventListener('click', (event) => {
        event.preventDefault();
        open_standards_modal('create');
    });

    // Event handler for displaying standards list when editing lesson
    const attachStandardsBtnEdit = document.querySelector('#attach-standards-btn-edit');
    attachStandardsBtnEdit.addEventListener('click', (event) => {
        event.preventDefault();
        open_standards_modal('edit');
    });

    // Define standard and grade dropdown selectors
    const subjectSelectors = document.querySelectorAll('.subject-selector');
    const gradeSelectors = document.querySelectorAll('.grade-selector');

    // Event handlers for changing content type or grade when creating or editing lesson (update standards option)
    subjectSelectors.forEach(selector => {
        selector.addEventListener('change', (event) => {
            standardsModalBodyCreate.innerHTML = '';
            standardsModalTitleCreate.innerHTML = '';
            standardsModalBodyEdit.innerHTML = '';
            standardsModalBodyCreate.innerHTML = '';
        });
    });

    gradeSelectors.forEach(selector => {
        selector.addEventListener('change', (event) => {
            standardsModalBodyCreate.innerHTML = '';
            standardsModalTitleCreate.innerHTML = '';
            standardsModalBodyEdit.innerHTML = '';
            standardsModalBodyCreate.innerHTML = '';
        });
    });

    // Click handler for search button on list view
    const searchBtn = document.querySelector('#search-btn');
    searchBtn.addEventListener('click', () => {
        list_plans(1);
    });

    // Allow user to use the "enter" key for search
    document.querySelector('#q').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            list_plans(1);
        }
    });

    function list_plans(page = 1) {

        // Clear previous contents and display page title
        listView.innerHTML = "";
        pageTitle.innerHTML = "My Plans";
        createPlanView.style.display = 'none';
        editPlanView.style.display = 'none';
        calendarView.style.display = 'none';
        lessonView.style.display = 'none';
        printBtnDiv.style.display = 'none';
        searchDiv.style.display = 'block';
        listView.style.display = 'block';

        const query = document.querySelector('#q').value.trim();

        let url = `/plans/?page=${page}`;

        if (query) {
            url += `&q=${encodeURIComponent(query)}`;
        }

        // Use GET method to access plans for this user
        fetch(url)
            .then(response => response.json())
            .then(data => {

                // Create a card for each lesson in data
                data.results.forEach(lesson => {
                    create_lesson_card(lesson);
                })
                setup_pagination(data);
            })
            .catch(error => {
                console.error("Fetch error:", error);
                show_message("Error loading lesson plans. Try again.", 'error');
            });
        pagination.style.display = 'block';
    }

    function create_lesson_card(lesson) {

        // Create a card to append to the list view
        const lessonCard = document.createElement('div');
        lessonCard.classList.add('card');
        lessonCard.id = `lesson-card-${lesson.id}`;

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        const row = document.createElement('div');
        row.classList.add('row');

        const colLeft = document.createElement('div');
        colLeft.classList.add('col-7');

        const colRight = document.createElement('div');
        colRight.classList.add('col-5');
        colRight.style.textAlign = 'right';

        row.append(colLeft, colRight);

        // Create title component
        const lessonTitle = document.createElement('a');
        lessonTitle.classList.add('listed-lesson-title');
        lessonTitle.innerText = lesson.title;
        lessonTitle.onclick = () => {
            view_lesson(lesson.id);
        }

        // Create component to display objective
        const objective = document.createElement('p');
        objective.innerText = lesson.objective;

        // Create component to display grade
        const grade = document.createElement('div');
        grade.classList.add('listed-lesson-grade');
        grade.innerText = `Grade ${lesson.grade}`;

        // Create component to display subject
        const subject = document.createElement('span');
        subject.classList.add('badge', 'badge-sm', 'rounded-pill', `${lesson.subject}-icon`, 'subject-icon');
        if (lesson.subject == 'MATH.CONTENT') {
            subjectName = 'Math';
        } else if (lesson.subject == 'ELA-LITERACY') {
            subjectName = 'ELA';
        } else if (lesson.subject == 'Social-Studies') {
            subjectName = 'Social Studies';
        } else {
            subjectName = lesson.subject;
        }
        subject.innerHTML = subjectName;

        const addToCalendarBtn = document.createElement('button');
        addToCalendarBtn.classList.add('btn', 'btn-sm', 'btn-outline-success');
        addToCalendarBtn.innerHTML = '<i class="fa fa-calendar"></i>';
        addToCalendarBtn.id = 'add-to-calendar-btn';
        addToCalendarBtn.title = 'Add to Calendar';
        addToCalendarBtn.onclick = () => {
            const lessonTitle = document.querySelector('#lesson-to-schedule');
            lessonTitle.dataset.id = lesson.id;
            lessonTitle.innerText = lesson.title;
            addToCalendarModal.show();
        }

        const viewLessonBtn = document.createElement('button');
        viewLessonBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary');
        viewLessonBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        viewLessonBtn.id = `view-lesson-${lesson.id}`;
        viewLessonBtn.title = 'Quick Look';
        viewLessonBtn.onclick = () => {
            quick_look(lesson);
        }

        const editLessonBtn = document.createElement('button');
        editLessonBtn.classList.add('btn', 'btn-sm', 'btn-outline-warning');
        editLessonBtn.innerHTML = '<i class="fa-solid fa-edit"></i>';
        editLessonBtn.id = `edit-lesson-${lesson.id}`;
        editLessonBtn.title = 'Edit Lesson';
        editLessonBtn.onclick = () => {
            edit_lesson(lesson.id);
        }

        const deleteLessonBtn = document.createElement('button');
        deleteLessonBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
        deleteLessonBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteLessonBtn.id = `delete-lesson-${lesson.id}`;
        deleteLessonBtn.title = 'Delete Lesson';
        deleteLessonBtn.onclick = () => {
            delete_lesson(lesson);
        }

        lessonCard.append(cardBody);
        cardBody.append(row);
        colLeft.append(lessonTitle, subject, grade, objective);
        colRight.append(addToCalendarBtn, viewLessonBtn, editLessonBtn, deleteLessonBtn);
        listView.append(lessonCard);
    }

    function setup_pagination(data) {
        pagination.innerHTML = '';

        // Append previous button, if necessary
        if (data.previous_page) {
            const previousBtn = document.createElement('button');
            previousBtn.innerHTML = '<i class="fa-solid fa-circle-left"></i>';
            previousBtn.style.fontSize = 'xx-large';
            previousBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary');
            previousBtn.onclick = () => {
                list_plans(data.previous_page);
            }
            pagination.append(previousBtn, ' ');
        }

        // Append next button, if necessary
        if (data.next_page) {
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '<i class="fa-solid fa-circle-right"></i>';
            nextBtn.style.fontSize = 'xx-large';
            nextBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary');
            nextBtn.onclick = () => {
                list_plans(data.next_page);
            }
            pagination.append(nextBtn);
        }

        // Display a message if user has not created any lessons
        if (data.results.length === 0) {
            listView.innerHTML = 'No lessons yet.';
            return;
        }
    }

    function list_standards(grade, content_type, context) {
        let modalTitle, modalBody;

        // Define modal title and body based on context
        if (context == 'edit') {
            modalTitle = standardsModalTitleEdit;
            modalBody = standardsModalBodyEdit;
        } else if (context == 'create') {
            modalTitle = standardsModalTitleCreate;
            modalBody = standardsModalBodyCreate;
        }

        // Display error message in modal if user did not select grade or content type
        if (!grade || !content_type) {
            modalTitle.innerHTML = 'Error';
            modalBody.innerHTML = 'Please select grade and content type before attaching standards.';
            return;
        }

        // Display error message in modal if standards unavailable for selected content type
        else if (!['MATH.CONTENT', 'ELA-LITERACY'].includes(content_type) || grade === 'PK') {
            modalTitle.innerHTML = 'Sorry!';
            modalBody.innerHTML = 'At this time, standards are only available for Grades K-5, Math and ELA.';
        } else {
            fetch(`/list_standards/?content_type=${encodeURIComponent(content_type)}&grade_id=${encodeURIComponent(grade)}`)
                .then(response => response.json())
                .then(data => {
                    modalBody.innerHTML = '';
                    modalTitle.innerText = `Grade ${grade}: ${content_type}`;

                    data.forEach(standard => {
                        // Add each standard to the lookup list
                        standardsLookup[String(standard.id)] = standard;
                        create_standard_option(standard, context);
                    });

                    const checkboxes = modalBody.querySelectorAll('input[name="standard_options"]');

                    checkboxes.forEach(option => {
                        if (preselectedStandards.includes(option.value)) {
                            option.checked = true;
                        }
                    });

                    update_selected_standards_div(context);
                });
        }
    }

    function open_standards_modal(context) {
        let selectedSubject, selectedGrade;
        if (context == 'edit') {
            selectedSubject = document.querySelector('#edit-lesson-subject').value;
            selectedGrade = document.querySelector('#edit-lesson-grade').value;
            list_standards(selectedGrade, selectedSubject, context);
            standardsModalEdit.show();
        } else if (context == 'create') {
            selectedSubject = document.querySelector('#subject').value;
            selectedGrade = document.querySelector('#grade').value;
            list_standards(selectedGrade, selectedSubject, context);
            standardsModalCreate.show();
        }
    }

    function create_standard_option(standard, context) {

        // Create an option element for each filtered standard
        const standardOption = document.createElement('input');
        standardOption.classList.add('form-check-input');
        standardOption.type = 'checkbox';
        standardOption.value = standard.id;
        standardOption.id = standard.id;
        standardOption.name = 'standard_options';
        standardOption.dataset.code = standard.code;

        // Create a label for each standard
        const optionLabel = document.createElement('label');
        optionLabel.classList.add('form-label');
        optionLabel.style.fontSize = 'small';
        optionLabel.setAttribute('for', standard.code);
        optionLabel.innerHTML = `<span style="font-style: italic;">(${standard.code})</span>: ${standard.description}`;

        // Wrap the option and label into a div
        const wrapper = document.createElement('div');
        wrapper.classList.add('form-check');
        wrapper.style.textAlign = 'left';
        wrapper.append(standardOption, optionLabel);

        // Append item to list in modal
        if (context == 'edit') {
            standardsModalBodyEdit.appendChild(wrapper);
        }

        if (context == 'create') {
            standardsModalBodyCreate.appendChild(wrapper);
        }

    }

    function update_selected_standards_div(context) {
        const container = context === 'create' ?
            document.getElementById('selected-standards-create') :
            document.getElementById('selected-standards-edit');

        // Clear previous display
        container.innerHTML = '';

        preselectedStandards.forEach(id => {
            const standard = standardsLookup[id];
            if (standard) {
                const span = document.createElement('span');
                span.classList.add('badge', 'bg-secondary', 'rounded-pill', 'badge-sm', 'me-1');
                span.textContent = standard.code;
                container.appendChild(span);
            }
        });
    }

    function view_lesson(lesson_id) {

        // Hide all other views
        // Clear previous contents and display page title

        pageTitle.innerHTML = '';
        searchDiv.style.display = 'none';
        listView.style.display = 'none';
        pagination.style.display = 'none';
        createPlanView.style.display = 'none';
        editPlanView.style.display = 'none';
        calendarView.style.display = 'none';
        lessonView.style.display = 'block';
        printBtnDiv.style.display = 'block';
        lessonViewAddToCalendarBtn.dataset.lessonId = lesson_id;
        lessonViewAddToCalendarBtn.style.display = 'block';
        lessonViewEditBtn.style.display = 'block';
        lessonViewEditBtn.dataset.lessonId = lesson_id;

        lessonViewEditBtn.onclick = () => {
            edit_lesson(lesson_id);
        }

        // Define components from lesson view in index.html
        const titleDisplay = document.querySelector('#title-lesson-view');
        const objectiveDisplay = document.querySelector('#objective-lesson-view');
        const activatorDisplay = document.querySelector('#activator-lesson-view');
        const teachingDisplay = document.querySelector('#teaching-lesson-view');
        const summarizerDisplay = document.querySelector('#summarizer-lesson-view');
        const standardsDisplay = document.querySelector('#standards-lesson-view');
        const attachmentsDisplay = document.querySelector('#attachments-lesson-view');
        const notesDisplay = document.querySelector('#notes-lesson-view');

        // Grab lesson info from db
        fetch(`/plans/?id=${lesson_id}`)
            .then(response => response.json())
            .then(plan => {
                console.log(plan.attachments);

                titleDisplay.innerText = plan.title;
                objectiveDisplay.innerText = plan.objective;
                activatorDisplay.innerText = plan.activator;
                teachingDisplay.innerText = plan.teaching;
                summarizerDisplay.innerText = plan.summarizer;
                notesDisplay.innerText = plan.notes;
                standardsDisplay.innerText = '';

                plan.standards.forEach(standard => {
                    const standardText = document.createElement('p');
                    standardText.classList.add('standards-muted');
                    standardText.innerText = `${standard.code}: ${standard.description}`;
                    standardsDisplay.append(standardText);
                });

                if (plan.attachments.length > 0) {
                    attachmentsDisplay.innerHTML = '';

                    plan.attachments.forEach(attachment => {
                        const link = create_attachment_link(attachment);

                        if (link) {
                            attachmentsDisplay.appendChild(link);
                            attachmentsDisplay.appendChild(document.createElement('br'));
                        }
                    });
                } else {
                    attachmentsDisplay.innerHTML = 'No attachments for this lesson.';
                }
            });
    }

    function create_attachment_link(attachment) {
        
        const url = attachment.download_url;
        if (!url) return null;

        const link = document.createElement('a');
        console.log("DOWNLOAD URL:", url);

        link.setAttribute("href", url);
        console.log("SET HREF:", link.href);

        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.dataset.id = attachment.id;
        link.classList.add('lesson-view-attachment');
        link.textContent = attachment.name;

        return link;
    }

    function delete_lesson(lesson) {
        const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirm-delete-modal'));
        const confirmDeleteBtn = document.querySelector('#confirm-delete-btn');

        // Display modal to confirm deletion when button is clicked
        document.querySelector('#modal-message').innerHTML = `Are you sure you want to delete <strong>${lesson.title}</strong>?`;
        confirmDeleteModal.show();

        confirmDeleteBtn.onclick = () => {

            fetch(`plans/?id=${lesson.id}`, {
                    method: 'POST'
                })
                .then(response => {
                    if (response.ok) {
                        console.log(`${lesson.title} deleted.`);
                        confirmDeleteModal.hide();
                        const card = document.getElementById(`lesson-card-${lesson.id}`);
                        if (card) card.remove();
                        show_message("Lesson plan deleted.", 'success');
                    } else {
                        console.log('Failed to delete lesson.')
                        show_message("Error deleting lesson. Try again.", 'error');
                        list_plans(1);
                    }
                })
        }
    }

    function quick_look(lesson) {
        // Grab lesson info from db
        fetch(`/plans/?id=${lesson.id}`)
            .then(response => response.json())
            .then(plan => {

                const quickLookModal = new bootstrap.Modal(document.querySelector('#quick-look-modal'));

                // Define components from quick look modal in index.html
                const titleDisplay = document.querySelector('#title-quick-look');
                const objectiveDisplay = document.querySelector('#objective-quick-look');
                const activatorDisplay = document.querySelector('#activator-quick-look');
                const teachingDisplay = document.querySelector('#teaching-quick-look');
                const summarizerDisplay = document.querySelector('#summarizer-quick-look');

                // Display critical lesson components in modal
                titleDisplay.innerText = plan.title;
                objectiveDisplay.innerHTML = `<strong>Objective:</strong> ${plan.objective}`;
                activatorDisplay.innerHTML = `<strong>Activator:</strong> ${plan.activator}`;
                teachingDisplay.innerHTML = `<strong>Teaching:</strong> ${plan.teaching}`;
                summarizerDisplay.innerHTML = `<strong>Summarizer:</strong> ${plan.summarizer}`;

                quickLookModal.show();
            });
    }

    // Add event listener to cancel editing a plan (return to list plans page)
    document.querySelector('#cancel-edit-btn').addEventListener('click', () => {
        list_plans(1);
    });

    function edit_lesson(lesson_id) {

        // Clear previous contents and display page title
        pageTitle.innerHTML = "Edit Plan";
        searchDiv.style.display = 'none';
        listView.style.display = 'none';
        pagination.style.display = 'none';
        createPlanView.style.display = 'none';
        calendarView.style.display = 'none';
        lessonView.style.display = 'none';
        printBtnDiv.style.display = 'none';
        editPlanView.style.display = 'block';

        // Define components of the new lesson form
        const editTitle = document.querySelector('#edit-lesson-title');
        const editObjective = document.querySelector('#edit-lesson-objective');
        const editActivator = document.querySelector('#edit-lesson-activator');
        const editTeaching = document.querySelector('#edit-lesson-teaching');
        const editSummarizer = document.querySelector('#edit-lesson-summarizer');
        const editSubject = document.querySelector('#edit-lesson-subject');
        const editGrade = document.querySelector('#edit-lesson-grade');
        const editAttachmentForm = document.querySelector('#edit-lesson-files');
        editAttachmentForm.value = '';
        const editAttachmentsContainer = document.querySelector('#edit-attachments-container');
        const editNotes = document.querySelector('#edit-lesson-notes');
        const replaceExistingBtn = document.querySelector('#replace-existing-lesson-btn');

        // Pre-fill lesson components
        fetch(`/plans?id=${lesson_id}`)
            .then(response => response.json())
            .then(plan => {
                editAttachmentsContainer.innerHTML = '';
                editTitle.value = plan.title;
                editObjective.innerText = plan.objective;
                editActivator.innerText = plan.activator;
                editTeaching.innerText = plan.teaching;
                editSummarizer.innerText = plan.summarizer;
                editSubject.value = plan.subject;
                editGrade.value = plan.grade;
                editNotes.innerText = plan.notes;
                replaceExistingBtn.dataset.lessonId = plan.id;

                plan.attachments.forEach(attachment => {
                    const link = create_attachment_link(attachment);

                    const deleteAttachmentBtn = document.createElement('button');
                    deleteAttachmentBtn.type = 'button';
                    deleteAttachmentBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
                    deleteAttachmentBtn.innerHTML = '<i class="fa-solid fa-x"></i>';
                    deleteAttachmentBtn.onclick = (event) => {
                        event.preventDefault();
                        delete_attachment(attachment.id);
                        if (link) link.style.display = 'none';
                        deleteAttachmentBtn.style.display = 'none';
                    }

                    const hidden = document.createElement('input');
                    hidden.type = 'hidden';
                    hidden.value = attachment.id;
                    hidden.name = 'existing_attachments[]';
                    
                    editAttachmentsContainer.appendChild(deleteAttachmentBtn);
                    editAttachmentsContainer.appendChild(hidden);
                    
                });

                // Reset selected standards
                preselectedStandards = plan.standards.map(s => String(s.id));

                // Populate standardsLookup with the lesson's existing standards
                plan.standards.forEach(s => {
                    standardsLookup[String(s.id)] = s;
                });

                // Immediately show badges for existing standards
                update_selected_standards_div('edit');
            });
    }

    // Event handler for clicking "replace existing lesson" in edit lesson form
    document.querySelector('#replace-existing-lesson-btn').addEventListener('click', (event) => {
        event.preventDefault();
        const lesson_id = event.currentTarget.dataset.lessonId;
        console.log("lesson_id:", lesson_id);
        update_lesson(lesson_id);
    });

    document.querySelector('#save-as-new-btn').addEventListener('click', (event) => {
        event.preventDefault();
        save_new();
    })

    async function save_new() {
        // Define elements from edit lesson form
        const title = document.querySelector("#edit-lesson-title").value;
        const objective = document.querySelector("#edit-lesson-objective").value;
        const activator = document.querySelector("#edit-lesson-activator").value;
        const teaching = document.querySelector("#edit-lesson-teaching").value;
        const summarizer = document.querySelector("#edit-lesson-summarizer").value;
        const notes = document.querySelector("#edit-lesson-notes").value;
        const subject = document.querySelector("#edit-lesson-subject").value;
        const grade = document.querySelector('#edit-lesson-grade').value;
        const editAttachmentsContainer = document.querySelector('#edit-attachments-container');

        const standards = preselectedStandards.map(id => parseInt(id));

        const newFilesInput = document.querySelector("#edit-lesson-files");
        const newFiles = newFilesInput.files;

        // Create a new formdata to send to backend
        const formData = new FormData();

        // Append new attachments to the formdata
        for (const file of newFiles) {
            formData.append("new_attachments[]", file);
        }

        // Append all elements to the form data to send to backend
        formData.append("title", title);
        formData.append("objective", objective);
        formData.append("activator", activator);
        formData.append("teaching", teaching);
        formData.append("summarizer", summarizer);
        formData.append("notes", notes);
        formData.append("subject", subject);
        formData.append("date", date);
        formData.append("grade", grade);

        // Append standards array to form data to send to backend
        standards.forEach(id => formData.append("standards[]", id));

        // Append existing attachments to replace
        const hiddenAttachmentInputs = document.querySelectorAll('#edit-attachments-container input[name="existing_attachments[]"]');
        hiddenAttachmentInputs.forEach(input => formData.append("existing_attachments[]", input.value));

        try {
            const response = await fetch("/edit_plan/", {
                method: "POST",
                body: formData
            });

            // Wait for response before providing user with success/error message
            const data = await response.json();
            if (response.ok) {
                console.log("Lesson created:", data.message);
                show_message("Lesson created!", 'success');
                list_plans(1);
            } else {
                show_message("Error creating new lesson. Try again.", 'error');
                console.error("Error:", data);
            }
        } catch (error) {
            console.error("Network error:", error);
            show_message("Error creating new lesson. Try again.", 'error');
        }
        console.log("Hidden inputs after fetch:", editAttachmentsContainer.querySelectorAll('input[name="existing_attachments[]"]'));

    }

    async function update_lesson(lesson_id) {

        // Define elements from edit lesson form
        const title = document.querySelector("#edit-lesson-title").value;
        const objective = document.querySelector("#edit-lesson-objective").value;
        const activator = document.querySelector("#edit-lesson-activator").value;
        const teaching = document.querySelector("#edit-lesson-teaching").value;
        const summarizer = document.querySelector("#edit-lesson-summarizer").value;
        const notes = document.querySelector("#edit-lesson-notes").value;
        const subject = document.querySelector("#edit-lesson-subject").value;

        const standards = preselectedStandards.map(id => parseInt(id));

        const newFilesInput = document.querySelector("#edit-lesson-files");
        const newFiles = newFilesInput.files;

        // Create a new formdata to send to backend
        const formData = new FormData();

        // Append new attachments to the formdata
        for (const file of newFiles) {
            formData.append("new_attachments[]", file);
        }
        formData.append("lesson_id", lesson_id);
        formData.append("title", title);
        formData.append("objective", objective);
        formData.append("activator", activator);
        formData.append("teaching", teaching);
        formData.append("summarizer", summarizer);
        formData.append("notes", notes);
        formData.append("subject", subject);

        // Append standards array
        standards.forEach(id => formData.append("standards[]", id));

        try {
            const response = await fetch(`/edit_plan/`, {
                method: "POST",
                body: formData
            });

            // Await response from backend before displaying error/success message
            const data = await response.json();
            if (response.ok) {
                console.log("Lesson updated:", data.message);
                show_message("Lesson updated!", 'success');
                view_lesson(lesson_id);
            } else {
                console.error("Error:", data);
                show_message("Error updating lesson. Try again.", 'error');
            }
        } catch (error) {
            console.error("Network error:", error);
            show_message("Error updating lesson. Try again.", 'error');
        }
    }

    // Display calendar and print div view, hide all other views
    function view_calendar() {
        pageTitle.innerHTML = "Calendar";
        searchDiv.style.display = 'none';
        listView.style.display = 'none';
        pagination.style.display = 'none';
        createPlanView.style.display = 'none';
        editPlanView.style.display = 'none';
        lessonView.style.display = 'none';
        printBtnDiv.style.display = 'flex';
        lessonViewEditBtn.style.display = 'none';
        lessonViewAddToCalendarBtn.style.display = 'none';
        calendarView.style.display = 'block';
    }

    // Attach handler for "submit" button after selecting a new date in the add to calendar modal
    const newDateSelected = document.querySelector('#added-to-calendar-btn');
    newDateSelected.addEventListener('click', (event) => {
        let lesson_id = document.querySelector('#lesson-to-schedule').dataset.id;
        add_to_calendar(lesson_id);
        addToCalendarModal.hide();
        window.location.reload();
        view_calendar();
    })

    async function add_to_calendar(lesson_id) {

        const formData = new FormData();
        const date = document.querySelector('#add_date').value;

        formData.append("lesson_id", lesson_id);
        formData.append("date", date);

        // Use POST method to create new lesson instance
        try {
            const response = await fetch('/calendar_events/', {
                method: "POST",
                body: formData
            });

            // Await response from backend before displaying error/success message
            const data = await response.json();
            if (response.ok) {
                console.log("Success:", data.message);
                show_message("Added to calendar!", 'success');
            } else {
                console.error("Error:", data);
                show_message("Something went wrong. Try again.", 'error');
            }
        } catch (error) {
            console.error("Network error:", error);
            show_message("Something went wrong. Try again.", 'error');
        }
    }

    function delete_attachment(attachment_id) {

        const formData = new FormData();
        formData.append("attachment_id", attachment_id);

        // Use POST to delete attachment
        fetch('/attachments/', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json());
    }

    // Run when user drags and drops on calendar
    function change_date(lesson_id, old_start, new_start) {

        var formData = new FormData();
        formData.append('lesson_id', lesson_id);
        formData.append('old_date', old_start.toISOString());
        formData.append('new_date', new_start.toISOString());

        // Send new information to backend for updating the lesson instance
        fetch('/calendar_events/', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json());
    }

    // Runs when user drags event from calendar to trash area
    function delete_event(lesson_id, date) {
        var formData = new FormData();
        formData.append('lesson_id', lesson_id);
        formData.append('date', date.toISOString());
        formData.append('remove', true);

        fetch('/calendar_events/', {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(show_message("Lesson plan removed from calendar.", 'success'))
    }
});

// Display an error or success alert at top of page on certain actions
function show_message(message, type = "success") {
    const container = document.getElementById('message-container');
    container.textContent = message;
    if (type === 'success') {
        container.classList.add('alert-success');
    } else {
        container.classList.add('alert-danger');
    }
    container.style.display = 'block';

    setTimeout(() => {
        container.style.display = 'none';
    }, 3000);
}
