document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.querySelector('.profile-circle');
    
    profileBtn.addEventListener('click', () => {
        // You can replace this with a Modal/Pop-up
        const newName = prompt("Edit your name:", "User Name");
        if (newName) {
            showAlert("Profile Updated Successfully!", "success", false);
        }
    });
});
// Inside public/js/dashboard.js
// async function loadStudentDashboard() {
//     const userId = localStorage.getItem('userId'); // Assuming you saved this at login
//     const res = await fetch(`/api/projects/student/${userId}`);
//     const projects = await res.json();

//     const grid = document.getElementById('studentProjects');
//     grid.innerHTML = projects.map(p => `
//         <div class="project-card">
//             <h3>${p.projectName}</h3>
//             <p>${p.domain}</p>
//             <div class="progress-container">
//                 <div class="progress-bar" style="width: 0%;"></div>
//             </div>
//             <button onclick="viewProject('${p._id}')">View Details</button>
//         </div>
//     `).join('');
// }