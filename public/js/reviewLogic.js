function loadReviewHistory(tasks) {
    const container = document.getElementById('review-cards-container');
    const userRole = localStorage.getItem('userRole'); // Get role from storage

    // Only run this logic for students
    if (!container || userRole !== 'student') return;
    
    container.innerHTML = ''; 

    // Filter for tasks that have been officially reviewed
    const reviewedTasks = tasks.filter(task => 
        task.status === 'Completed' || task.status === 'Changes Required'
    );

    if (reviewedTasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:gray;">No mentor reviews found yet.</p>';
        return;
    }

    reviewedTasks.forEach(task => {
        const card = document.createElement('div');
        
        // Map status to your existing CSS classes in taskLogic.js
        const statusClass = task.status === 'Completed' ? 'completed' : 'changes-required';
        
        card.className = `review-card ${statusClass}`;
        card.innerHTML = `
            <div class="review-header" style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="margin:0; color:#2d3748;">${task.taskName}</h4>
                <span class="status-badge ${task.status === 'Completed' ? 'status-finished' : 'status-rejected'}">
                    ${task.status === 'Completed' ? 'Accepted ✅' : 'Changes Required ❌'}
                </span>
            </div>

            <div class="mentor-comment" style="margin-top:10px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
                <strong style="font-size:0.85rem; color:#4a5568;">MENTOR FEEDBACK:</strong>
                <p style="margin:5px 0 0 0; color:#1a202c; font-style:italic;">
                    "${task.mentorFeedback || 'The mentor updated the status without a specific comment.'}"
                </p>
            </div>

            <div style="margin-top:8px; font-size:0.75rem; color:#a0aec0;">
                Review for: ${task.assignedTo}
            </div>
        `;
        container.appendChild(card);
    });
}
