document.addEventListener('DOMContentLoaded', fetchAdminData);

async function fetchAdminData() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/admin/overview', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            updateAnalytics(data);
            renderUsers(data.users);
            renderProjects(data.projects);
        } else {
            alert("Access Denied or Session Expired");
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error("Admin Load Error:", err);
    }
}

function updateAnalytics(data) {
    document.getElementById('stat-projects').innerText = data.projects.length;
    document.getElementById('stat-students').innerText = data.users.filter(u => u.role === 'student').length;
    document.getElementById('stat-mentors').innerText = data.users.filter(u => u.role === 'mentor').length;
}

function renderUsers(users) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.name}</strong></td>
            <td>${user.userId}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>
                <button class="btn-delete" onclick="deleteUser('${user._id}')" title="Delete User">
                    <i class="fas fa-trash-alt"></i>❌</button>
            </td>
        </tr>
    `).join('');
}

function renderProjects(projects) {
    const tbody = document.getElementById('projectTableBody');
    tbody.innerHTML = projects.map(proj => `
        <tr>
            <td>${proj.projectName}</td>
            <td>${proj.mentor ? proj.mentor.name : 'Unassigned'}</td>  
            <td>${proj.students.length} Members</td>
            <td>${proj.status || 'Active'}</td>
        </tr>
    `).join('');
}

function filterUsers() {
    const query = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#userTableBody tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
    });
}

async function deleteUser(mongoId) {
    if (!confirm("Are you sure you want to remove this user from the system?")) return;

    try {
        const response = await fetch(`/api/admin/users/${mongoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });

        if (response.ok) {
            alert("User deleted successfully.");
            fetchAdminData(); // Refresh the table
        } else {
            alert("Failed to delete user.");
        }
    } catch (err) {
        console.error("Delete Error:", err);
    }
}