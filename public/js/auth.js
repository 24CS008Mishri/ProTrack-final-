// Function for Registration
async function registerUser(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const userId = document.getElementById('userId').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, userId, email, role, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Account created successfully!");
            window.location.href = '/pages/login.html';
        } else {
            // on error
triggerShake();
            alert("Registration failed: " + data.error);
        }
    } catch (err) {
        // on error
triggerShake();
        console.error("Error:", err);
        alert("An error occurred during registration.");
    }
}
// Function for Login
// public/js/auth.js

async function loginUser(event) {
    event.preventDefault();
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
    });

    // Read the body ONCE here
    const data = await response.json(); 

    if (response.ok) {
        // CRITICAL: Save the ID so the dashboard isn't 'undefined'
        localStorage.setItem('userId', data.userId); 
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userRole', data.role); // Ensure your backend sends 'role'
        localStorage.setItem('authToken', data.token);
        
        alert("Welcome, " + data.name);
        
        if (data.role === 'student') {
            window.location.href = '/pages/student-dash.html';
        } else if (data.role === 'mentor') {
            window.location.href = '/pages/mentor-dash.html';
        }
    } else {
        // on error
triggerShake();
        alert(data.message || "Login failed");
    }
}

