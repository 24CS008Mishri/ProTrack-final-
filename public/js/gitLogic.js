{
    const gitParams = new URLSearchParams(window.location.search);
    const gitProjId = gitParams.get('id');
    let cachedCommits = [];
    let userMap = JSON.parse(localStorage.getItem(`github_map_${gitProjId}`)) || {};

    // 1. Fetch Data from GitHub (Project-Specific)
    window.fetchCommits = async function(repoUrl, studentList) {
        try {
            const repoPath = repoUrl.replace('https://github.com/', '').split('/');
            const response = await fetch(`https://api.github.com/repos/${repoPath[0]}/${repoPath[1]}/commits?per_page=100`);
            
            if (response.ok) {
                cachedCommits = await response.json();
                renderGlobalFeed(cachedCommits.slice(0, 8));
                
                // Set up Mapping UI and Mentor Dropdown
                renderMappingInputs(studentList);
                
                if (window.userRole === 'mentor') {
                    setupMentorControls(studentList);
                } else {
                    renderIndividualHeatmap(cachedCommits, window.userGithub);
                }
            }
        } catch (err) {
            console.error("GitHub Sync Error:", err);
        }
    };

    // 2. Mapping UI: Link Database Names to GitHub Handles
    function renderMappingInputs(studentList) {
        const container = document.getElementById('github-mapping-container');
        if (!container) return;

        container.innerHTML = studentList.map(name => `
            <div class="mapping-row">
                <label>${name}</label>
                <input type="text" class="github-username-input" data-student="${name}" 
                       placeholder="GitHub handle" value="${userMap[name] || ''}">
            </div>
        `).join('');
    }

    window.saveGithubMapping = function() {
        const inputs = document.querySelectorAll('.github-username-input');
        inputs.forEach(input => {
            const student = input.getAttribute('data-student');
            const github = input.value.trim().toLowerCase();
            if (github) userMap[student] = github;
        });

        localStorage.setItem(`github_map_${gitProjId}`, JSON.stringify(userMap));
        alert("Mappings saved! Refreshing...");
        location.reload(); // Reload to apply changes
    };

    // 3. Heatmap Rendering (Space-filling logic)
    window.renderIndividualHeatmap = function(commits, targetHandle) {
        const grid = document.getElementById('heatmap');
        if (!grid) return;
        grid.innerHTML = '';

        const safeHandle = (targetHandle || "").toLowerCase();
        
        // Match against GitHub login
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
            const square = document.createElement('div');
            square.className = 'heatmap-square';
            const count = dateMap[d.toDateString()] || 0;
            
            let level = 0;
            if (count > 0) level = 1;
            if (count > 2) level = 2;
            if (count > 4) level = 3;
            if (count > 6) level = 4;

            square.setAttribute('data-level', level);
            square.title = `${d.toDateString()}: ${count} commits`;
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
        feed.innerHTML = commits.map(item => `
            <div class="commit-item">
                <img src="${item.author?.avatar_url || ''}" class="commit-avatar">
                <div class="commit-details">
                    <p class="commit-msg">${item.commit.message}</p>
                    <p class="commit-author">${item.commit.author.name}</p>
                </div>
            </div>
        `).join('');
    }
}