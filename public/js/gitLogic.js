{
    const gitParams = new URLSearchParams(window.location.search);
    const gitProjId = gitParams.get('id');
    let cachedCommits = [];
    // Initialize userMap - will be overwritten by DB data in loadProjectData
    let userMap = {};
    const projectId = urlParams.get('id');
    const storageKey = `repoLink_${projectId}`;

    // Attach functions to 'window' so the HTML onclick can see them
    window.handleGithubClick = function() {
        const currentProjectRepo = localStorage.getItem(storageKey);
        if (!currentProjectRepo) {
            document.getElementById('repo-modal').style.display = 'flex';
        } else {
            window.open(currentProjectRepo, '_blank');
        }
    };

    window.closeRepoModal = function() {
        document.getElementById('repo-modal').style.display = 'none';
    };

    window.saveGithubLink = async function() {
        const repoUrl = document.getElementById('repo-url-input').value.trim();

        if (!repoUrl.includes("github.com/")) {
            alert("Please enter a valid GitHub URL");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoLink: repoUrl })
            });

            if (response.ok) {
                localStorage.setItem(storageKey, repoUrl);
                document.getElementById('github-content').classList.remove('locked');
                window.closeRepoModal();
                // If you have a fetchCommits function, call it here
                if (window.fetchCommits) window.fetchCommits(repoUrl);
            }
        } catch (err) {
            console.error("Sync Error:", err);
        }
    };
    window.fetchCommits = async function(repoUrl, studentList) {
        try {
            const repoPath = repoUrl.replace('https://github.com/', '').split('/');
            const response = await fetch(`https://api.github.com/repos/${repoPath[0]}/${repoPath[1]}/commits?per_page=100`);
            
            if (response.ok) {
                cachedCommits = await response.json();
                renderGlobalFeed(cachedCommits.slice(0, 8));
                
                // renderMappingInputs now populates based on the DB studentList
                renderMappingInputs(studentList);
                
                if (window.userRole === 'mentor') {
                    setupMentorControls(studentList);
                } else {
                    // FIX: Get the handle from the userMap using your logged-in ID
                const myId = localStorage.getItem('userId');
                const myGithubHandle = window.userMap ? window.userMap[myId] : null;
                
                console.log("Found handle in map for heatmap:", myGithubHandle);
                renderIndividualHeatmap(cachedCommits, myGithubHandle);
                }
            }
        } catch (err) {
            console.error("GitHub Sync Error:", err);
        }
    };

function renderMappingInputs(studentList) {
    const container = document.getElementById('github-mapping-container');
    if (!container) return;

    // 1. DIRECT FIX: Instead of relying on global 'userRollNo', 
    // we pull it directly from storage right now.
    const activeUserId = localStorage.getItem('userId') || window.userId || "";
    const loggedInId = String(activeUserId).trim().toLowerCase();

    const isMentor = (localStorage.getItem('userRole') === 'mentor') || (window.userRole === 'mentor');

    container.innerHTML = studentList.map(rollNo => {
        const cleanRollNo = String(rollNo || "").trim().toLowerCase();
        
        // 2. The Match: Now '24cs002' will match '24cs002'
        const isSelf = (cleanRollNo === loggedInId);
        const canEdit = !isMentor && isSelf;

        return `
            <div class="mapping-row" id="row-${rollNo}" style="opacity: ${isMentor || isSelf ? '1' : '0.4'}; display: flex; align-items: flex-end; gap: 10px; margin-bottom: 15px;">
                <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 5px; ${isSelf ? 'color: #2d9696; font-weight: 600;' : ''}">
                        ${rollNo} ${isSelf ? '<span class="you-badge">(You)</span>' : ''}
                    </label>
                    <input type="text" 
                           id="input-${rollNo}"
                           class="github-username-input" 
                           data-student="${rollNo}" 
                           placeholder="${canEdit ? 'Enter handle' : 'Read-only'}" 
                           value="${(window.userMap && window.userMap[rollNo]) || ''}"
                           ${canEdit ? '' : 'disabled'} 
                           style="width: 100%; ${canEdit ? 'border: 1px solid #2d9696;' : 'background: rgba(0,0,0,0.03); border: none;'}">
                </div>
                ${canEdit ? `
                    <button onclick="verifyGithubHandle('${rollNo}')" class="github-icon-btn" style="padding: 8px 12px; font-size: 0.8rem; height: 38px;">
                        Verify
                    </button>
                ` : ''}
            </div>
            <div id="status-${rollNo}" class="verification-status-container"></div>
        `;
    }).join('');

    const saveBtn = document.getElementById('final-save-btn');
    if (saveBtn) {
        saveBtn.style.display = isMentor ? 'none' : 'block';
    }
}
  window.saveGithubMapping = async function() {
    const token = localStorage.getItem('authToken');
    const myId = localStorage.getItem('userId'); // Get your Roll No (e.g., 24cs002)
    const githubHandle = document.getElementById(`input-${myId}`).value.trim();

    if (!githubHandle) return alert("Please enter a username first.");

    try {
        const response = await fetch(`/api/projects/${gitProjId}/github-map-simple`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: myId,        // Sending ID directly in body
                handle: githubHandle, // Sending handle directly
                token: token         // Sending token as a backup
            })
        });

        if (response.ok) {
            alert("Saved!");
            location.reload(); // Refresh to show the new data
        } else {
            alert("Save failed. Check console.");
        }
    } catch (err) {
        console.error(err);
    }
};

    window.renderIndividualHeatmap = function(commits, targetHandle) {
        const grid = document.getElementById('heatmap');
        if (!grid) return;
        grid.innerHTML = '';

        const safeHandle = (targetHandle || "").toLowerCase();
        console.log("Generating heatmap for handle:", safeHandle);

        const userCommits = commits.filter(c => 
            c.author?.login?.toLowerCase() === safeHandle
        );

        const dateMap = {};
        userCommits.forEach(c => {
            const date = new Date(c.commit.author.date).toDateString();
            dateMap[date] = (dateMap[date] || 0) + 1;
        });

        for (let i = 83; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            
            const square = document.createElement('div');
            square.className = 'heatmap-square';
            const count = dateMap[dateStr] || 0;
            
            let level = 0;
            if (count > 0) level = 1;
            if (count > 2) level = 2;
            if (count > 4) level = 3;
            if (count > 6) level = 4;

            square.setAttribute('data-level', level);
            square.title = `${dateStr}: ${count} commits`;
            grid.appendChild(square);
        }
    };

    function setupMentorControls(studentList) {
        const header = document.getElementById('heatmap-header');
        if (!header) return;

        let select = document.getElementById('student-heatmap-selector');
        if (select) select.remove();

        select = document.createElement('select');
        select.id = 'student-heatmap-selector';
        select.innerHTML = `<option value="">Select Student</option>` + 
            studentList.map(name => `<option value="${userMap[name] || ''}">${name}</option>`).join('');

        header.appendChild(select);
        select.onchange = (e) => renderIndividualHeatmap(cachedCommits, e.target.value);
    }

    function renderGlobalFeed(commits) {
        const feed = document.getElementById('commit-feed');
        if (!feed) return;
        feed.innerHTML = commits.map(item => `
            <div class="commit-item">
                <img src="${item.author?.avatar_url || ''}" class="commit-avatar" alt="avatar">
                <div class="commit-details">
                    <p class="commit-msg">${item.commit.message}</p>
                    <p class="commit-author">${item.commit.author.name}</p>
                </div>
            </div>
        `).join('');
    }

    window.verifyGithubHandle = async function(rollNo) {
    const input = document.getElementById(`input-${rollNo}`);
    const status = document.getElementById(`status-${rollNo}`);
    const saveBtn = document.getElementById('final-save-btn');
    const handle = input.value.trim();

    if (!handle) {
        status.innerHTML = `<small style="color: #e67e22;">Please enter a username.</small>`;
        return;
    }

    status.innerHTML = `<small style="color: #70a1a1;">Pinging GitHub API...</small>`;

    try {
        const response = await fetch(`https://api.github.com/users/${handle}`);
        if (response.ok) {
            const data = await response.json();
            // HTML for the "Check GitHub Link" you asked for
            status.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #27ae60; margin-top: 5px;">
                    <i class="fas fa-check-circle"></i>
                    <small>Verified: <b>${data.name || handle}</b></small>
                    <a href="${data.html_url}" target="_blank" class="github-profile-link">
                        <i class="fas fa-external-link-alt"></i> View Profile
                    </a>
                </div>
            `;
            input.style.borderColor = "#27ae60";
            if (saveBtn) saveBtn.disabled = false;
        } else {
            status.innerHTML = `<small style="color: #e74c3c;"><i class="fas fa-times-circle"></i> User not found.</small>`;
            input.style.borderColor = "#e74c3c";
            if (saveBtn) saveBtn.disabled = true;
        }
    } catch (err) {
        status.innerHTML = `<small style="color: #e74c3c;">Connection error.</small>`;
    }
};
}