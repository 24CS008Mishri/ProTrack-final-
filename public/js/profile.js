document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // =======================================================
    // 1. ADD THIS NEW SECTION HERE (SMART BACK BUTTON)
    // =======================================================
    const backBtn = document.getElementById("backBtn");
    
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            // Check the role stored in LocalStorage
            const role = localStorage.getItem("userRole"); 

            if (role === "student") {
                window.location.href = "student-dash.html"; // Go to Student Dash
            } else if (role === "mentor") {
                window.location.href = "mentor-dash.html"; // Go to Mentor Dash
            } else {
                window.location.href = "login.html"; // Fallback
            }
        });
    }
    // =======================================================


    // ================= LOAD DATA =================
    async function loadProfile() {
        try {
            const response = await fetch("/api/auth/profile", {
                headers: { "Authorization": "Bearer " + token }
            });
            const user = await response.json();

            // Safe function to fill inputs only if they exist
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || "";
            };

            setVal("name", user.name);
            setVal("userId", user.userId);
            setVal("email", user.email);
            setVal("role", user.role);
            setVal("department", user.department); 

            // Update Header
            const nameHeader = document.getElementById("display_name");
            if (nameHeader) nameHeader.innerText = user.name || "User";
            
            const roleHeader = document.getElementById("display_role");
            if (roleHeader) roleHeader.innerText = user.role || "";

            const avatar = document.getElementById("avatarLetter");
            if (avatar && user.name) avatar.innerText = user.name.charAt(0).toUpperCase();

        } catch (error) {
            console.error("Error loading profile:", error);
        }
    }
    loadProfile();

    // ================= EDIT BUTTON LOGIC (FIXED) =================
    const editBtn = document.getElementById("editBtn");
    const saveBtn = document.getElementById("saveBtn");

    if (editBtn) {
        editBtn.addEventListener("click", () => {
            console.log("Edit button clicked!"); 

            const fieldsToUnlock = ["name", "email", "department"];

            fieldsToUnlock.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.disabled = false;
                    input.style.backgroundColor = "#ffffff"; 
                    input.style.border = "2px solid #28a745"; 
                    input.style.cursor = "text";
                }
            });

            editBtn.style.display = "none";
            if (saveBtn) saveBtn.style.display = "inline-block";
        });
    } else {
        console.error("Edit Button not found! Check your HTML ID.");
    }

    // ================= SAVE BUTTON LOGIC =================
    const profileForm = document.getElementById("profileForm");

    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const getName = document.getElementById("name") ? document.getElementById("name").value : "";
            const getEmail = document.getElementById("email") ? document.getElementById("email").value : "";
            const getDept = document.getElementById("department") ? document.getElementById("department").value : "";

            const updatedData = {
                name: getName,
                email: getEmail,
                department: getDept
            };

            try {
                const response = await fetch("/api/auth/profile", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    showAlert("Saved Successfully!", "success", false);
                    location.reload();
                } else {
                    showAlert("Update failed.", "error", false);
                }
            } catch (error) {
                console.error(error);
            }
        });
    }
});