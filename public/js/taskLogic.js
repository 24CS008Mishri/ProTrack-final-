const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id'); 
const userRollNo = localStorage.getItem('userId'); 
const userRole = localStorage.getItem('userRole'); 

if (!userRollNo) {
    console.warn("WARNING: No userRollNo found in localStorage. Buttons will not show!");
}
// Current Active Task for Modal tracking
let currentActiveTaskId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!projectId) {
        console.error("No Project ID found in URL.");
        return;
    }
    setupUI();
    await loadProjectData();
    
    // Notification Polling: Runs every 30 seconds
    checkNotifications(); 
    setInterval(checkNotifications, 30000);
});

// 1. UI Setup: Toggles mentor-only sections

function setupUI() {
    const mentorSection = document.getElementById('mentorAddSection');
    const tabBtn = document.getElementById('dynamic-tab-btn');
    const reviewTitle = document.getElementById('review-title');

    if (userRole === 'mentor') {
        if (mentorSection) mentorSection.style.display = 'block';
        if (tabBtn) tabBtn.innerText = "Submissions"; // Mentor sees "Submissions"
        if (reviewTitle) reviewTitle.innerText = "Pending Submissions";
    } else {
        if (tabBtn) tabBtn.innerText = "Review History"; // Student sees "Review History"
        if (reviewTitle) reviewTitle.innerText = "Mentor Feedback Log";
    }
}
// 2. Data Loader: Fetches tasks from API
async function loadProjectData() {
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        const project = await response.json();
       if (response.ok && project.tasks) {

        // Target the dropdown element
            const dropdown = document.getElementById('newTaskAssignedTo');
            
            // Only mentors need to see/use this dropdown
            if (userRole === 'mentor' && dropdown && project.students) {
                // Clear existing options except for 'General'
                dropdown.innerHTML = '<option value="General">General (Unassigned)</option>';
                
                // Fetch student IDs from the project data and add them as options
                project.students.forEach(rollNo => {
                    const opt = document.createElement('option');
                    opt.value = rollNo;
                    opt.innerText = rollNo;
                    dropdown.appendChild(opt);
                });
            }
    renderTaskTable(project.tasks);
    updateAllProgressViews(project.tasks);


    if (userRole === 'mentor') {
        // Mentor sees the reviewable cards (from taskLogic.js)
        renderSubmissions(project.tasks); 
    } else {
        // Student sees the history cards (from reviewLogic.js)
        if (typeof loadReviewHistory === 'function') {
            loadReviewHistory(project.tasks);
        }
    }
} else {
            console.error("Failed to load project tasks.");
        }
    } catch (err) {
        console.error("Error fetching project data:", err);
    }
}


// 3. MAIN TABLE RENDERER: Fixes Priority & Complete Button
function renderTaskTable(tasks) {
    const tableBody = document.getElementById('taskTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const now = new Date();

    tasks.forEach(task => {
        const row = document.createElement('tr');
        const deadlineDate = new Date(task.deadline);
        
        // STATUS COLOR LOGIC
        let statusClass = 'status-unassigned';
        if (task.status === 'Completed') statusClass = 'status-finished';
        else if (deadlineDate < now && task.status !== 'Completed') statusClass = 'status-overdue';
        else if (task.status === 'Pending Review') statusClass = 'status-pending';
        else if (task.status === 'Changes Required') statusClass = 'status-rejected';
        else if (task.assignedTo !== 'General') statusClass = 'status-progress';

        // PRIORITY BADGE
        const pClass = task.priority ? task.priority.toLowerCase() : 'medium';
        const priorityHtml = `<span class="priority-badge ${pClass}">${task.priority || 'Medium'}</span>`;

        // NORMALIZATION
        const assignedClean = String(task.assignedTo || "").trim().toLowerCase();
        const userRollClean = String(userRollNo || "").trim().toLowerCase();
        const infoIcon = userRole === 'mentor' ? '✏️' : 'ℹ️';

        // DEBUG: Helps identify ID mismatches
        console.log(`COMPARING: [${assignedClean}] with [${userRollClean}]`);

        // ACTIONS COLUMN
        let actionContent = "";
        let infoContent = `<span onclick="openTaskDetails('${task._id}')" style="cursor:pointer;">ℹ️</span>`;
        
        // FIX: Define the variable assignedName here so the mentor block can use it
        const assignedName = task.assignedTo === "General" ? "Unassigned" : task.assignedTo;

        if (userRole === 'mentor') {
            actionContent = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>${assignedName}</span>
                    <button class="delete-btn" onclick="deleteTask('${task._id}')" title="Delete Task" style="background:none; border:none; cursor:pointer;">
                        🗑️
                    </button>
                </div>
            `;
        } else {
            // Student View Logic
            if (assignedClean === "general") {
                actionContent = `<button class="select-btn" onclick="claimTask('${task._id}')">Select Task</button>`;
            } else if (assignedClean === userRollClean) {
    const hasSubmission = task.submission && task.submission.link;
    const submissionLink = hasSubmission ? task.submission.link : "";

    // Format the date (e.g., "Feb 13, 4:45 PM")
const lastUpdate = (task.submission && task.submission.submittedAt) 
    ? new Date(task.submission.submittedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
    : "";

    // 1. If the task is already fully COMPLETED
    if (task.status === 'Completed') {
        actionContent = `<span class="self-tag" style="color:#28a745; font-weight:bold;">Accepted ✅</span>`;
    } 
    // 2. If it is PENDING or IN PROGRESS or CHANGES REQUIRED
    else {
        actionContent = `
            <div class="student-actions">
                <span style="display:block; margin-bottom:5px; font-weight:bold;">${task.assignedTo}</span>
                
                ${hasSubmission ? 
                    `<div class="current-sub">
                        <a href="${submissionLink}" target="_blank" class="view-link">My Submission 🔗</a>
                         <button type="button" onclick="previewLink()" class="preview-btn">👁️ Preview</button>

                        <small style="display:block; color:#718096; margin-bottom:5px;">Updated: ${lastUpdate}</small>
                        <button class="edit-sub-btn" onclick="openSubmissionModal('${task._id}', '${submissionLink}')">Edit Link</button>
                    </div>` : 
                    `<button class="action-btn comp" onclick="openSubmissionModal('${task._id}')">Submit Work</button>`
                }

                ${task.status === 'Pending Review' ? 
                    `<span style="color:#6b46c1; font-size:0.8rem; font-weight:bold;">⏳ Under Review</span>` : 
                    `<button class="action-btn prog" onclick="updateStatus('${task._id}', 'In Progress')">Mark In Progress</button>`
                }
            </div>`;
    }
} else {
                actionContent = `<span style="color:gray">${task.assignedTo}</span>`;
            }
        }

        row.innerHTML = `
            <td style="text-align: left;">${priorityHtml}
            <strong style="cursor:pointer;" onclick="openTaskDetails('${task._id}')">
            ${task.taskName} ${infoIcon}
        </strong>
             </td>
            <td>${actionContent}</td>
            <td><div class="status-pill ${statusClass}"></div></td>
        `;
        tableBody.appendChild(row);
    });
}
// 4. MENTOR PORTAL: Submission Reviews
function renderSubmissions(tasks) {
    const container = document.getElementById('submissionList');
    if (!container) return;
    
    const pendingTasks = tasks.filter(t => t.status === 'Pending Review');
    
    container.innerHTML = pendingTasks.map(task => {
        // ACCESING THE NESTED LINK: task.submission.link
        const rawLink = (task.submission && task.submission.link) ? task.submission.link : "";
        let finalLink = rawLink.trim();

        return `
            <div class="submission-card">
                <div class="sub-info">
                    <h4>${task.taskName}</h4>
                    <p>Student: <strong>${task.assignedTo}</strong></p>
                    ${finalLink ? 
                        `<a href="${finalLink}" target="_blank" class="view-link">Open Work 🔗</a>` : 
                        `<span style="color:red">No link provided</span>`
                    }
                </div>
                <div class="sub-actions">
                    <textarea id="feedback-${task._id}" placeholder="Add feedback..."></textarea>
                    <button class="action-btn comp" onclick="reviewTask('${task._id}', 'Completed')">Approve</button>
                    <button class="action-btn reject" onclick="reviewTask('${task._id}', 'Changes Required')">Reject</button>
                </div>
            </div>`;
    }).join('');
}
// 5. NOTIFICATION LOGIC (Top-Right)
async function checkNotifications() {
    if (!userRollNo || userRole !== 'student') return;
    try {
        const res = await fetch(`/api/projects/my-notifications/${userRollNo}`);
        const notifications = await res.json();
        
        const badge = document.getElementById('notif-count');
        const list = document.getElementById('notif-items');

        if (notifications.length > 0) {
            badge.innerText = notifications.length;
            badge.style.display = 'block';
            list.innerHTML = notifications.map(n => `
                <div class="notif-item" style="padding:10px; border-bottom:1px solid #ddd; color: #333;">
                    <strong>${n.status}</strong>: ${n.taskName}
                </div>
            `).join('');
        }
    } catch (err) { console.error("Notification check failed", err); }
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) {
        dropdown.style.display = (dropdown.style.display === 'none' || dropdown.style.display === '') ? 'block' : 'none';
    }
}
// 6. MODAL & SUBMISSION ACTIONS
function openSubmissionModal(taskId) {
    currentActiveTaskId = taskId;
    const modal = document.getElementById('submissionModal');
    const linkInput = document.getElementById('submissionLink');

    if (linkInput) linkInput.value = ""; // Clear previous entry
    if (modal) modal.style.display = 'flex';
}

function closeSubmissionModal() {
    const modal = document.getElementById('submissionModal');
    if (modal) modal.style.display = 'none';
}

/**
 * NEW: Preview Helper
 * Allows students to verify their link actually works before submitting.
 */
function previewLink() {
    const linkInput = document.getElementById('submissionLink');
    let link = linkInput.value.trim();
    if (!link) return alert("Please paste a link first!");

    // Apply the protocol fix for the preview as well
    if (!/^https?:\/\//i.test(link)) {
        link = `https://${link}`;
    }
    window.open(link, '_blank');
}

async function submitTaskProof() {
    const linkInput = document.getElementById('submissionLink');
    let linkValue = linkInput.value.trim();

    if (!linkValue) return alert("Please paste a link!");

    // Add https if missing to prevent the "same page reload" issue
    if (!/^https?:\/\//i.test(linkValue)) {
        linkValue = `https://${linkValue}`;
    }

    // MATCH THE NESTED STRUCTURE SHOWN IN YOUR DATABASE
    const payload = { 
        projectId: projectId, 
        taskId: currentActiveTaskId, 
        submission: { 
            link: linkValue 
        } 
    };

    const res = await fetch('/api/projects/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert("Submitted!");
        closeSubmissionModal();
        loadProjectData(); // Refresh to see the change
    }
}
// 7. UTILITIES: Tabs & Status Updates
function showSection(sectionId, element) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => c.style.display = 'none');
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById(`${sectionId}-section`);
    if (target) {
        target.style.display = 'block';
        if (element) element.classList.add('active');
    }
}


async function updateStatus(taskId, newStatus) {
    await fetch('/api/projects/update-task-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, taskId, status: newStatus })
    });
    loadProjectData();
}

async function reviewTask(taskId, newStatus) {
    const feedback = document.getElementById(`feedback-${taskId}`).value;
    await fetch('/api/projects/review-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, taskId, status: newStatus, feedback })
    });
    loadProjectData();
}
// Helper function to handle claiming a task (missing in previous code)
// taskLogic.js
async function claimTask(taskId) {
    const payload = {
        projectId: projectId,
        taskId: taskId,
        studentId: userRollNo 
    };

    try {
        const res = await fetch('/api/projects/claim-task', {
            method: 'PATCH', // MUST MATCH THE ROUTE
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Task claimed successfully!");
            await loadProjectData(); 
        } else {
            console.error("Server responded with error:", res.status);
        }
    } catch (err) {
        console.error("Claim error:", err);
    }
}
// Add these functions to your taskLogic.js

function openAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) modal.style.display = 'flex';
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) modal.style.display = 'none';
}
async function saveNewTask() {
    const name = document.getElementById('newTaskName').value.trim();
    const assigned = document.getElementById('newTaskAssignedTo').value.trim();
    const description = document.getElementById('newTaskDescription').value.trim();
    const priority = document.getElementById('newTaskPriority').value;
    const deadline = document.getElementById('newTaskDeadline').value;

    if (!name || !deadline) return alert("Task Name and Deadline are required!");

    // Prepare the data according to your Mongoose Schema
    const taskData = {
        projectId: projectId,
        taskName: name,
        description: description,
        priority: priority,
        deadline: deadline,
        // If assigned is empty, let it default to "General"
        assignedTo: assigned || "General",
        // Logic: if assigned to a person, status starts as 'In Progress'
        // otherwise, it is 'Unassigned'
        status: assigned ? "In Progress" : "Unassigned"
    };

    try {
        const res = await fetch('/api/projects/add-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (res.ok) {
            alert("Task created successfully!");
            closeAddTaskModal();
            loadProjectData(); // Refresh the table
        }
    } catch (err) {
        console.error("Error creating task:", err);
    }
}

async function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
        return;
    }

    try {
        const res = await fetch(`/api/projects/delete-task`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                projectId: projectId, 
                taskId: taskId 
            })
        });

        if (res.ok) {
            alert("Task deleted successfully.");
            await loadProjectData(); // Refresh the table
        } else {
            const err = await res.json();
            alert("Error: " + err.message);
        }
    } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to connect to the server.");
    }
}

let currentEditTaskId = null;

// 1. Open the Modal (Logic for both Mentor and Student)
async function openTaskDetails(taskId) {
    currentEditTaskId = taskId;
    try {
        const res = await fetch(`/api/projects/task-details/${projectId}/${taskId}`);
        const task = await res.json();

        // Standard fields
        document.getElementById('editTaskName').value = task.taskName;
        document.getElementById('editTaskDescription').value = task.description || "No description provided.";
        document.getElementById('editTaskDeadline').value = task.deadline ? task.deadline.split('T')[0] : "";

        // FEEDBACK LOGIC: Show feedback if it exists
        const feedbackArea = document.getElementById('feedbackSection');
        const feedbackText = document.getElementById('viewTaskFeedback');
        
        if (task.mentorFeedback) {
            feedbackArea.style.display = 'block';
            feedbackText.innerText = task.mentorFeedback;
        } else {
            feedbackArea.style.display = 'none';
        }

        // Mentor vs Student toggle
        const isMentor = (localStorage.getItem('userRole') === 'mentor');
        const inputs = document.querySelectorAll('.modal-input');
        inputs.forEach(input => input.readOnly = !isMentor);

        document.getElementById('mentorEditActions').style.display = isMentor ? 'flex' : 'none';
        document.getElementById('studentViewActions').style.display = isMentor ? 'none' : 'flex';

        document.getElementById('taskDetailsModal').style.display = 'flex';
    } catch (err) {
        console.error("Error loading task details:", err);
    }
}

// 2. Mentor Only: Save Changes
async function updateTaskData() {
    // projectId should be the global variable defined at the top of taskLogic.js
    const updatedData = {
        projectId: projectId, 
        taskId: currentEditTaskId,
        taskName: document.getElementById('editTaskName').value,
        description: document.getElementById('editTaskDescription').value,
        deadline: document.getElementById('editTaskDeadline').value
    };

    const res = await fetch('/api/projects/update-task', { // <--- Ensure this matches backend
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
    });

    if (res.ok) {
        alert("Changes saved!");
        closeTaskDetailsModal();
        loadProjectData(); // Refresh the table to show new info
    } else {
        const errorData = await res.json();
        alert("Failed to save: " + errorData.message);
    }
}

function closeTaskDetailsModal() {
    document.getElementById('taskDetailsModal').style.display = 'none';
}

