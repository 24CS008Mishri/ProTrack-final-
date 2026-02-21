let projects = [];

document.addEventListener('DOMContentLoaded', async () => {
    const studentId = localStorage.getItem('userId');
    const studentName = localStorage.getItem('userName');
    const projectGrid = document.getElementById('studentProjects');
    const profileCircle = document.querySelector('.profile-circle'); // Updated to match your HTML class

    // Security check: If no ID found, send back to login
    if (!studentId) {
        window.location.href = '/pages/login.html';
        return;
    }

    // Display student initial
    if (studentName && profileCircle) {
        profileCircle.innerText = studentName.charAt(0).toUpperCase();
    }

    try {
        const response = await fetch(`/api/projects/student/${studentId}`);
        projects = await response.json();

        if (projects.length === 0) {
            projectGrid.innerHTML = `<p style="color: #bbb; grid-column: 1/-1; text-align: center;">No projects assigned yet.</p>`;
            return;
        }

        // Render the list of assigned projects matching Mentor Dashboard details
        projectGrid.innerHTML = projects.map(p => {
            const needsMoreStudents = p.students.length < p.requiredStudents;
            const slotsLeft = p.requiredStudents - p.students.length;
            const isCompleted = p.status === 'Completed';

            return `
            <div class="project-card" 
                 onclick="if(!event.target.closest('.info-icon')) location.href='project-view.html?id=${p._id}'" 
                 style="cursor: pointer; position: relative;">
                
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3 style="margin: 0; flex: 1; padding-right: 10px;">${p.projectName}</h3>
                     ${isCompleted ? '<span class="complete-checkmark" title="Project Verified">✅</span>' : ''}

                    <div class="button-group">
                        <span class="info-icon" 
                              onclick="event.stopPropagation(); openProjectInfo('${p._id}')" 
                              title="View Info">ℹ️</span>
                    </div>
                </div>

                <p><strong>Domain:</strong> ${p.domain}</p>
                <p><strong>Students:</strong> ${p.students.length > 0 ? p.students.join(', ') : 'None assigned'}</p>
                
                <div class="slot-info" style="margin-top: 10px; font-size: 0.9rem;">
                    ${needsMoreStudents ? 
                        `<span style="color: #ff9800;">${slotsLeft} slot(s) remaining</span>` 
                        : `<span style="color: #4caf50;">Project Full</span>`}
                </div>
                <div style="margin-top: 5px; font-size: 0.8rem; color: #5a7a7a; opacity: 0.7;">Status: ${p.status}</div>
            </div>
            `;
        }).join('');

       
    } catch (err) {
        console.error("Error loading projects:", err);
        projectGrid.innerHTML = `<p style="color: red;">Error loading dashboard. Please try again.</p>`;
    }

    // Also load the notification count/badge immediately
    if (typeof fetchNotifications === 'function') {
        fetchNotifications(); 
    }
});

function openProjectInfo(projectId) {
    const project = projects.find(p => p._id === projectId);

    if (project) {
        document.getElementById('infoProjectName').innerText = project.projectName;
        document.getElementById('infoProjectDescription').innerText = 
            project.description || "No description provided for this project.";
        
        document.getElementById('projectInfoModal').style.display = 'flex';
    }
}

function closeInfoModal() {
    document.getElementById('projectInfoModal').style.display = 'none';
}