/**
 * PROGRESS LOGIC FILE
 * Handles: Team Progress Bars, Student Impact, and Analytics
 */
// Inside progressLogic.js

function updateAllProgressViews(tasks) {
    if (!tasks) return;

    const userRole = localStorage.getItem('userRole'); // Get role from storage
    const mentorSection = document.getElementById('mentorAnalytics');

    // 1. Always render individual progress bars for everyone
    renderTeamProgress(tasks);

    // 2. ONLY if user is a Mentor, show the chart and health stats
    if (userRole === 'mentor') {
        if (mentorSection) mentorSection.style.display = 'flex'; // Show the row
        renderTaskPieChart(tasks);
    } else {
        // Ensure it stays hidden if a student is logged in
        if (mentorSection) mentorSection.style.display = 'none';
    }
}
function renderTeamProgress(tasks) {
    const progressContainer = document.getElementById('progressStats');
    if (!progressContainer) return;

    // 1. Calculate Stats
    const studentStats = {};
    const unassignedCount = tasks.filter(t => t.status === "Unassigned").length;

    tasks.forEach(task => {
        // Log to verify status strings match exactly: "In Progress"
        console.log(`Task: ${task.taskName}, Status: [${task.status}]`);

        if (task.assignedTo && task.assignedTo !== "General") {
            if (!studentStats[task.assignedTo]) {
                studentStats[task.assignedTo] = { 
                    total: 0, completed: 0, inProgress: 0, rejected: 0, overdue: 0 
                };
            }
            studentStats[task.assignedTo].total++;
            
            if (task.status === 'Completed') studentStats[task.assignedTo].completed++;
            else if (task.status === 'In Progress') studentStats[task.assignedTo].inProgress++; // triggers ⏳
            else if (task.status === 'Changes Required') studentStats[task.assignedTo].rejected++;

            if (new Date(task.deadline) < new Date() && task.status !== 'Completed') {
                studentStats[task.assignedTo].overdue++;
            }
        }
    });

    // 2. Build the Backlog HTML
    const backlogHtml = `
        <div class="progress-card backlog">
            <div class="progress-header">
                <span class="student-id">📋 General Pool</span>
                <span class="percent-label" style="background: #718096;">Backlog</span>
            </div>
            <p>There are <strong>${unassignedCount}</strong> tasks available for anyone to claim.</p>
        </div>
    `;

    // 3. Build Student Progress Cards
    const isMentor = (localStorage.getItem('userRole') === 'mentor');
    const studentCardsHtml = Object.keys(studentStats).map(student => {
        const stats = studentStats[student];
        const percentage = Math.round((stats.completed / stats.total) * 100) || 0;
        
        let barColorClass = "progress-normal";
        if (isMentor) {
            if (stats.overdue > 0) barColorClass = "progress-critical";
            else if (stats.rejected > 0) barColorClass = "progress-warning";
        }

        return `
            <div class="progress-card">
                <div class="progress-header">
                    <span class="student-id">👤 ${student}</span>
                    <span class="percent-label">${percentage}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill ${barColorClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-footer">
                    <div class="tally">
                        <span>✅ ${stats.completed}</span>
                        <span>⏳ ${stats.inProgress}</span>
                        ${stats.rejected > 0 ? `<span class="rejected-text">❌ ${stats.rejected}</span>` : ''}
                    </div>
                    <small>${stats.completed}/${stats.total} Tasks</small>
                </div>
            </div>`;
    }).join('');

    // 4. Set the innerHTML ONE TIME
    progressContainer.innerHTML = backlogHtml + studentCardsHtml;

    // 5. Render Contribution if needed
    if (!isMentor) {
        renderStudentContribution(tasks, studentStats);
    }
}
function renderStudentContribution(tasks, studentStats) {
    const userRoll = localStorage.getItem('userId');
    const totalDone = tasks.filter(t => t.status === 'Completed').length;
    const myDone = studentStats[userRoll] ? studentStats[userRoll].completed : 0;
    const contribution = Math.round((myDone / totalDone) * 100) || 0;

    const contribHtml = `
        <div class="contribution-box">
            <h4>Your Impact</h4>
            <p>You have completed <strong>${myDone}</strong> tasks, contributing <strong>${contribution}%</strong> to total completion.</p>
        </div>`;
    document.getElementById('progressStats').insertAdjacentHTML('afterbegin', contribHtml);
}

let myPieChart = null; // Global variable to store the chart instance

function renderTaskPieChart(tasks) {
    const ctx = document.getElementById('taskPieChart');
    if (!ctx) return;

    // 1. Calculate Status Totals
    const totals = {
        unassigned: tasks.filter(t => t.status === "Unassigned").length,
        active: tasks.filter(t => t.status === "In Progress").length,
        review: tasks.filter(t => t.status === "Pending Review").length,
        done: tasks.filter(t => t.status === "Completed").length,
        rejected: tasks.filter(t => t.status === "Changes Required").length
    };

    // 2. Destroy old chart if it exists (prevents ghosting on refresh)
    if (myPieChart) {
        myPieChart.destroy();
    }

    // 3. Create the Chart
    myPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Backlog', 'In Progress', 'Pending Review', 'Done', 'Rejected'],
            datasets: [{
                data: [totals.unassigned, totals.active, totals.review, totals.done, totals.rejected],
                backgroundColor: ['#cbd5e0', '#9f7aea', '#f6ad55', '#48bb78', '#f56565'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    updateHealthStatus(totals, tasks);
}

// Inside progressLogic.js
function updateHealthStatus(totals, tasks) {
    const container = document.getElementById('healthStatus');
    const totalTasks = tasks.length;
    const completionRate = Math.round((totals.done / totalTasks) * 100) || 0;
    
    let statusMsg = "✅ On Track";
    let color = "#48bb78"; // Green

    if (totals.rejected > (totalTasks * 0.2)) {
        statusMsg = "⚠️ At Risk";
        color = "#e53e3e"; // Red
    } else if (totals.unassigned > (totalTasks * 0.4)) {
        statusMsg = "⏳ Starting Up";
        color = "#9f7aea"; // Purple
    }

    container.innerHTML = `
        <span class="health-value" style="color: ${color}">${statusMsg}</span>
        <p style="color: #4a5568;">The project is <strong>${completionRate}%</strong> complete.</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 10px 0;">
        <small style="color: #718096;">Total Tasks: ${totalTasks}</small>
    `;
}