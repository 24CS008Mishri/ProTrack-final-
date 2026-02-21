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

async function handleProjectCompletion() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const token = localStorage.getItem('token');

    try {
        // 1. Tell the Database the project is done
        const res = await fetch(`/api/projects/${projectId}/complete`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'Completed' })
        });

        if (!res.ok) throw new Error("Failed to update database");

        // 2. ONLY IF DATABASE SUCCESS: Show Celebration & UI changes
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        updateUItoCompleted(); // Helper function to change colors/icons
        
    } catch (err) {
        console.error("Error completing project:", err);
        showAlert("Could not save project status. Please try again.", "error", false);
    }
}
function updateUItoCompleted(savedRating = 0) {
    document.querySelector('.project-header-card').classList.add('project-complete');
    document.getElementById('statusTag').innerText = "Completed";
    document.getElementById('statusTag').className = "status-tag complete";
    document.getElementById('completeBtn').style.display = 'none';
    document.getElementById('ratingSection').style.display = 'block';
    
    if (savedRating > 0) {
        setRating(savedRating); // Highlight stars if they were already saved
    }
}
/*
async function handleProjectCompletion() {
    // Add this inside your handleProjectCompletion function
document.querySelector('.project-header-card').style.boxShadow = "2px 8px 32px rgba(113, 205, 116, 0.98)";
    // 1. Celebration
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    // 2. Card Transition
    const card = document.querySelector('.project-header-card');
    if (card) card.classList.add('project-complete');

    // 3. Status Tag Update (The part that was crashing)
    const statusTag = document.getElementById('statusTag');
    if (statusTag) {
        statusTag.innerText = "Completed";
        statusTag.className = "status-tag complete";
    }

    // 4. Toggle Buttons
    const completeBtn = document.getElementById('completeBtn');
    const ratingSection = document.getElementById('ratingSection');
    
    if (completeBtn) completeBtn.style.display = 'none';
    if (ratingSection) {
        ratingSection.style.display = 'block';
        ratingSection.classList.add('fade-in');
    }
}*/

// Add this to reviewLogic.js
let currentRating = 0;

function setRating(n) {
    currentRating = n;
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < n);
    });

    // Send to backend
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    fetch(`/api/projects/${projectId}/complete`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating: currentRating })
    })
    .then(res => res.json())
    .then(data => console.log("Success:", data))
    .catch(err => console.error("Error:", err));
}