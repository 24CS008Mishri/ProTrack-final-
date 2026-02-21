async function toggleNotifications() {
    const dropdown = document.getElementById('notiDropdown');
    const btn = document.getElementById('notiBtn');
    
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
    btn.classList.toggle('active', !isVisible);

    if (!isVisible) fetchNotifications();
}


function renderNotifications(notis) {
    const list = document.getElementById('notiList');
    const badge = document.querySelector('.noti-badge');
    
    const unreadCount = notis.filter(n => !n.isRead).length;
    badge.innerText = unreadCount;
    badge.style.display = unreadCount > 0 ? 'block' : 'none';

    list.innerHTML = notis.map(n => `
        <div class="noti-item ${n.isRead ? '' : 'unread'}" onclick="markAsRead('${n._id}', this)">
            <div class="noti-content">
                <p style="margin:0; font-size:0.85rem;">
                    <strong>${n.senderName}</strong> ${n.message} <strong>${n.taskTitle || n.projectName}</strong>
                </p>
                <small style="color: #888;">${new Date(n.createdAt).toLocaleTimeString()}</small>
            </div>
        </div>
    `).join('');
}
async function markAllAsRead() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/notifications/read-all', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Update the UI: Remove unread styling
            const unreadItems = document.querySelectorAll('.noti-item.unread');
            unreadItems.forEach(item => item.classList.remove('unread'));

            // Hide the red badge
            const badge = document.querySelector('.noti-badge');
            if (badge) {
                badge.innerText = '0';
                badge.style.display = 'none';
            }
            console.log("All notifications marked as read.");
        }
    } catch (err) {
        console.error("Error marking all as read:", err);
    }
}

async function fetchNotifications() {
    const token = localStorage.getItem('authToken'); // Ensure 'token' is the exact key name
    
    if (!token) {
        console.warn("No token found, skipping notification fetch.");
        return;
    }

    try {
        const res = await fetch('/api/notifications', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`, // Must have 'Bearer ' prefix
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 401) {
            console.error("Session expired. Please log in again.");
            // window.location.href = 'login.html'; // Optional: redirect to login
            return;
        }

        const data = await res.json();
        
        // Safety Check: Ensure data is an array before passing to render
        if (Array.isArray(data)) {
            renderNotifications(data);
        } else {
            console.error("Expected array but got:", data);
            renderNotifications([]); // Pass empty array to prevent crash
        }

    } catch (err) {
        console.error("Fetch error:", err);
    }
}
// Close dropdown when clicking anywhere else on the page
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('notiDropdown');
    const notiBtn = document.getElementById('notiBtn');
    
    // Check if the click was outside the button and the dropdown
    if (dropdown.style.display === 'block' && 
        !notiBtn.contains(e.target) && 
        !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});