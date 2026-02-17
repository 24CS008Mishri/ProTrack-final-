/**
 * PROGRESS LOGIC FILE - UPDATED FOR SOFT GLASSMORPHISM THEME
 */

// 1. Theme Configuration (Matching EduFlow Palette)
const THEME = {
    teal: '#4a7c7c',      // Deeper Sidebar Teal (Done)
    peach: '#e8a58d',     // Saturated Peach (In Progress)
    orange: '#d97d5a',    // Deep Soft Orange (Review)
    lavender: '#9a94bd',  // Muted Deep Lavender (Backlog)
    coral: '#d48a6a',     // Terracotta Coral (Rejected)
    text: '#2d4a4a',
    muted: '#5a7a7a'
};

function updateAllProgressViews(tasks) {
    if (!tasks) return;

    const userRole = localStorage.getItem('userRole'); 
    const mentorSection = document.getElementById('mentorAnalytics');

    // Always render progress cards
    renderTeamProgress(tasks);

    // Mentor-only Chart and Health stats
    if (userRole === 'mentor') {
        if (mentorSection) {
            mentorSection.style.display = 'flex';
            renderTaskPieChart(tasks);
        }
    } else {
        if (mentorSection) mentorSection.style.display = 'none';
    }
}

function renderTeamProgress(tasks) {
    const progressContainer = document.getElementById('progressStats');
    if (!progressContainer) return;

    const studentStats = {};
    const unassignedCount = tasks.filter(t => t.status === "Unassigned").length;

    tasks.forEach(task => {
        if (task.assignedTo && task.assignedTo !== "General") {
            if (!studentStats[task.assignedTo]) {
                studentStats[task.assignedTo] = { 
                    total: 0, completed: 0, inProgress: 0, rejected: 0, overdue: 0 
                };
            }
            studentStats[task.assignedTo].total++;
            
            if (task.status === 'Completed') studentStats[task.assignedTo].completed++;
            else if (task.status === 'In Progress') studentStats[task.assignedTo].inProgress++;
            else if (task.status === 'Changes Required') studentStats[task.assignedTo].rejected++;

            if (new Date(task.deadline) < new Date() && task.status !== 'Completed') {
                studentStats[task.assignedTo].overdue++;
            }
        }
    });

    // Backlog HTML (Lavender Theme)
    const backlogHtml = `
        <div class="progress-card backlog" style="background: rgba(220, 214, 247, 0.3);">
            <div class="progress-header">
                <span class="student-id" style="color: #6b46c1;">📋 General Pool</span>
                <span class="percent-label" style="background: #6b46c1; color: white;">Backlog</span>
            </div>
            <p style="color: #4a5568;">There are <strong>${unassignedCount}</strong> tasks available for anyone to claim.</p>
        </div>
    `;

    const isMentor = (localStorage.getItem('userRole') === 'mentor');
    const studentCardsHtml = Object.keys(studentStats).map(student => {
        const stats = studentStats[student];
        const percentage = Math.round((stats.completed / stats.total) * 100) || 0;
        
        // Dynamic bar colors based on status
        let barColor = THEME.teal;
        if (stats.overdue > 0) barColor = THEME.coral;
        else if (stats.rejected > 0) barColor = THEME.orange;

        return `
            <div class="progress-card">
                <div class="progress-header">
                    <span class="student-id">👤 ${student}</span>
                    <span class="percent-label" style="color: ${THEME.teal}">${percentage}%</span>
                </div>
                <div class="progress-bar-container" style="background: #edf2f7; height: 10px; border-radius: 10px; overflow: hidden; margin: 15px 0;">
                    <div class="progress-bar-fill" style="width: ${percentage}%; background: ${barColor}; height: 100%; border-radius: 10px; transition: width 0.5s;"></div>
                </div>
                <div class="progress-footer" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="tally" style="display: flex; gap: 10px; font-size: 0.85rem;">
                        <span>✅ ${stats.completed}</span>
                        <span>⏳ ${stats.inProgress}</span>
                        ${stats.rejected > 0 ? `<span style="color: ${THEME.coral}">❌ ${stats.rejected}</span>` : ''}
                    </div>
                    <small style="color: ${THEME.muted}">${stats.completed}/${stats.total} Tasks</small>
                </div>
            </div>`;
    }).join('');

    progressContainer.innerHTML = backlogHtml + studentCardsHtml;

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
        <div class="contribution-box" style="background: linear-gradient(135deg, ${THEME.teal}, ${THEME.peach}); color: white; padding: 20px; border-radius: 20px; margin-bottom: 25px; box-shadow: 0 8px 20px rgba(112, 161, 161, 0.2);">
            <h4 style="margin: 0; font-size: 1.1rem;">Your Impact</h4>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">You have completed <strong>${myDone}</strong> tasks, contributing <strong>${contribution}%</strong> to total completion.</p>
        </div>`;
    
    const container = document.getElementById('progressStats');
    if (container) container.insertAdjacentHTML('afterbegin', contribHtml);
}

let myPieChart = null; 
function renderTaskPieChart(tasks) {
    const ctx = document.getElementById('taskPieChart');
    if (!ctx) return;

    // Handle the empty state to avoid chart errors
    if (!tasks || tasks.length === 0) {
        ctx.style.display = 'none'; // Hide canvas if no data
        // Optional: show a "No Data Available" message here
        return;
    } else {
        ctx.style.display = 'block';
    }

    const totals = {
        unassigned: tasks.filter(t => t.status === "Unassigned").length,
        active: tasks.filter(t => t.status === "In Progress").length,
        review: tasks.filter(t => t.status === "Pending Review").length,
        done: tasks.filter(t => t.status === "Completed").length,
        rejected: tasks.filter(t => t.status === "Changes Required").length
    };

    if (myPieChart) myPieChart.destroy();

    myPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Backlog', 'In Progress', 'Review', 'Done', 'Rejected'],
            datasets: [{
                data: [totals.unassigned, totals.active, totals.review, totals.done, totals.rejected],
                backgroundColor: [THEME.lavender, THEME.peach, THEME.orange, THEME.teal, THEME.coral],
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.5)' // Glassy border for slices
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Important for the wrapper height
            layout: {
                padding: 10
            },
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { 
                        usePointStyle: true, 
                        padding: 15,
                        font: { family: "'Rounded Sans', sans-serif", size: 11 }
                    } 
                }
            }
        }
    });
    
    updateHealthStatus(totals, tasks);
}
function updateHealthStatus(totals, tasks) {
    const container = document.getElementById('healthStatus');
    const totalTasks = tasks.length;
    const completionRate = Math.round((totals.done / totalTasks) * 100) || 0;
    
    let statusMsg = "✅ On Track";
    let color = THEME.teal;

    if (totals.rejected > (totalTasks * 0.2)) {
        statusMsg = "⚠️ At Risk";
        color = THEME.coral;
    } else if (totals.unassigned > (totalTasks * 0.4)) {
        statusMsg = "⏳ Starting Up";
        color = THEME.lavender;
    }

    container.innerHTML = `
        <span class="health-value" style="color: ${color}; font-size: 2rem; font-weight: 800;">${statusMsg}</span>
        <p style="color: ${THEME.text}; margin-top: 5px;">The project is <strong>${completionRate}%</strong> complete.</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 15px 0;">
        <small style="color: ${THEME.muted};">Total Tasks: ${totalTasks}</small>
    `;
}