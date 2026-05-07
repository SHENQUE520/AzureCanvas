// Mock Data
let allRobots = [
    { id: 1, name: 'Alice', avatar: '', activeTimeStart: '08:00', activeTimeEnd: '22:00', postFrequency: 60, replyFrequency: 30, interests: 'Campus Life,Study', enabled: true, createdAt: '2024-05-01', posts: 456, replies: 1234 },
    { id: 2, name: 'Bob', avatar: '', activeTimeStart: '09:00', activeTimeEnd: '21:00', postFrequency: 45, replyFrequency: 20, interests: 'Technology,Programming', enabled: true, createdAt: '2024-05-02', posts: 389, replies: 987 },
    { id: 3, name: 'Charlie', avatar: '', activeTimeStart: '07:00', activeTimeEnd: '23:00', postFrequency: 90, replyFrequency: 45, interests: 'Sports,Entertainment', enabled: true, createdAt: '2024-05-03', posts: 298, replies: 845 },
    { id: 4, name: 'Diana', avatar: '', activeTimeStart: '10:00', activeTimeEnd: '20:00', postFrequency: 75, replyFrequency: 35, interests: 'Art,Music', enabled: true, createdAt: '2024-05-04', posts: 198, replies: 498 },
    { id: 5, name: 'Edward', avatar: '', activeTimeStart: '08:00', activeTimeEnd: '18:00', postFrequency: 120, replyFrequency: 60, interests: 'Books,Literature', enabled: false, createdAt: '2024-05-05', posts: 123, replies: 345 }
];

let activityLogs = [
    { time: '03:45', robot: 'Alice', action: 'Generated a new post about campus life', type: 'post' },
    { time: '03:32', robot: 'Bob', action: 'Replied to a discussion about programming', type: 'reply' },
    { time: '03:20', robot: 'System', action: 'Robot Charlie was enabled', type: 'robot' },
    { time: '03:15', robot: 'Diana', action: 'Generated a new post about music', type: 'post' },
    { time: '03:08', robot: 'Alice', action: 'Replied to 5 different discussions', type: 'reply' },
    { time: '02:55', robot: 'System', action: 'New robot "Frank" was created', type: 'robot' },
    { time: '02:40', robot: 'Bob', action: 'Generated a new post about technology trends', type: 'post' },
    { time: '02:28', robot: 'Charlie', action: 'Replied to a sports discussion', type: 'reply' },
    { time: '02:15', robot: 'System', action: 'Robot Edward was disabled', type: 'robot' },
    { time: '02:00', robot: 'Diana', action: 'Generated 2 new posts about art', type: 'post' },
    { time: '01:45', robot: 'Alice', action: 'Replied to a study discussion', type: 'reply' },
    { time: '01:30', robot: 'Bob', action: 'Generated a post about coding', type: 'post' },
    { time: '01:15', robot: 'System', action: 'Statistics updated', type: 'robot' },
    { time: '01:00', robot: 'Charlie', action: 'Generated a post about football', type: 'post' },
    { time: '00:45', robot: 'Diana', action: 'Replied to a music recommendation', type: 'reply' },
    { time: '00:30', robot: 'Alice', action: 'Generated a post about exams', type: 'post' },
    { time: '00:15', robot: 'System', action: 'Daily backup completed', type: 'robot' },
    { time: '00:00', robot: 'Bob', action: 'Replied to 3 discussions', type: 'reply' },
    { time: '23:45', robot: 'Charlie', action: 'Generated a post about games', type: 'post' },
    { time: '23:30', robot: 'Diana', action: 'Generated a post about painting', type: 'post' },
    { time: '23:15', robot: 'System', action: 'System health check passed', type: 'robot' },
    { time: '23:00', robot: 'Alice', action: 'Replied to a campus news post', type: 'reply' },
    { time: '22:45', robot: 'Bob', action: 'Generated a post about JavaScript', type: 'post' },
    { time: '22:30', robot: 'Charlie', action: 'Replied to a basketball discussion', type: 'reply' },
    { time: '22:15', robot: 'System', action: 'Scheduled task executed', type: 'robot' }
];

let selectedRobots = new Set();
let token = null;

function showMessage(text, type = 'success') {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    setTimeout(() => { message.style.display = 'none'; }, 3000);
}

function showLoading() {
    document.getElementById('robotList').innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner loading-spinner"></i>
            <p>Loading robots...</p>
        </div>
    `;
}

function showEmpty() {
    document.getElementById('robotList').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-robot"></i>
            <h2>No Robots Added Yet</h2>
            <p>Click "Add Robot" to create your first robot</p>
            <button class="btn btn-submit" onclick="openModal()" style="display:inline-flex;">
                <i class="fas fa-plus"></i> Add Robot
            </button>
        </div>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function updateStats() {
    const total = allRobots.length;
    const active = allRobots.filter(r => r.enabled).length;
    const totalPosts = allRobots.reduce((sum, r) => sum + (r.posts || 0), 0);
    const totalReplies = allRobots.reduce((sum, r) => sum + (r.replies || 0), 0);

    const totalRobotsEl = document.getElementById('totalRobots');
    const activeRobotsEl = document.getElementById('activeRobots');
    const totalPostsEl = document.getElementById('totalPosts');
    const totalRepliesEl = document.getElementById('totalReplies');
    const robotCountEl = document.getElementById('robotCount');

    if (totalRobotsEl) totalRobotsEl.textContent = total;
    if (activeRobotsEl) activeRobotsEl.textContent = active;
    if (totalPostsEl) totalPostsEl.textContent = totalPosts.toLocaleString();
    if (totalRepliesEl) totalRepliesEl.textContent = totalReplies.toLocaleString();
    if (robotCountEl) robotCountEl.textContent = total;

    updateDashboardStats(total, active, totalPosts, totalReplies);
}

function updateDashboardStats(total, active, totalPosts, totalReplies) {
    const dashboardCards = document.querySelectorAll('.stat-card');
    if (dashboardCards.length >= 4) {
        const totalCard = dashboardCards[0].querySelector('h3');
        const activeCard = dashboardCards[1].querySelector('h3');
        const postsCard = dashboardCards[2].querySelector('h3');
        const repliesCard = dashboardCards[3].querySelector('h3');

        if (totalCard) totalCard.textContent = total;
        if (activeCard) activeCard.textContent = active;
        if (postsCard) postsCard.textContent = totalPosts.toLocaleString();
        if (repliesCard) repliesCard.textContent = totalReplies.toLocaleString();
    }
}

function filterRobots() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    let filtered = allRobots.filter(robot => {
        const matchesSearch = robot.name.toLowerCase().includes(searchTerm) ||
            (robot.interests && robot.interests.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && robot.enabled) ||
            (statusFilter === 'inactive' && !robot.enabled);
        return matchesSearch && matchesStatus;
    });

    renderRobotGrid(filtered);
}

function renderRobotGrid(robots) {
    const robotList = document.getElementById('robotList');

    if (!robots || robots.length === 0) {
        robotList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h2>No Robots Found</h2>
                <p>Try adjusting your search or filter</p>
            </div>
        `;
        return;
    }

    robotList.innerHTML = '<div class="robot-grid">' + robots.map(robot => `
        <div class="robot-card ${selectedRobots.has(robot.id) ? 'selected' : ''}" data-id="${robot.id}">
            <div class="robot-header">
                <input type="checkbox" class="robot-checkbox" ${selectedRobots.has(robot.id) ? 'checked' : ''} 
                    onchange="toggleSelect(${robot.id})">
                <div class="robot-avatar">
                    ${robot.avatar ? `<img src="${robot.avatar}" alt="${robot.name}">` : robot.name.charAt(0).toUpperCase()}
                </div>
                <div class="robot-info">
                    <h3>${robot.name}</h3>
                    <span class="status ${robot.enabled ? 'active' : 'inactive'}">
                        ${robot.enabled ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            <div class="robot-meta">
                <span><i class="far fa-clock"></i> ${robot.activeTimeStart} - ${robot.activeTimeEnd}</span>
                <span><i class="far fa-calendar"></i> ${formatDate(robot.createdAt)}</span>
            </div>
            <div class="robot-stats">
                <div class="stat-item">
                    <div class="label">Post</div>
                    <div class="value">${robot.postFrequency}m</div>
                </div>
                <div class="stat-item">
                    <div class="label">Reply</div>
                    <div class="value">${robot.replyFrequency}m</div>
                </div>
                <div class="stat-item">
                    <div class="label">Topics</div>
                    <div class="value">${robot.interests ? robot.interests.split(',').length : 0}</div>
                </div>
            </div>
            <div class="robot-actions">
                <button class="btn-edit" onclick="editRobot(${robot.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-toggle" onclick="toggleRobot(${robot.id})">
                    <i class="fas fa-toggle-${robot.enabled ? 'on' : 'off'}"></i>
                    ${robot.enabled ? 'Disable' : 'Enable'}
                </button>
                <button class="btn-post" onclick="generatePost(${robot.id})">
                    <i class="fas fa-pen"></i> Post
                </button>
                <button class="btn-reply" onclick="generateReply(${robot.id})">
                    <i class="fas fa-reply"></i> Reply
                </button>
                <button class="btn-delete" onclick="deleteRobot(${robot.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('') + '</div>';
}

function loadRobots() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn?.classList.add('loading');

    setTimeout(() => {
        updateStats();
        filterRobots();
        renderLogs();
        refreshBtn?.classList.remove('loading');
    }, 500);
}

function toggleSelect(id) {
    if (selectedRobots.has(id)) {
        selectedRobots.delete(id);
    } else {
        selectedRobots.add(id);
    }
    updateBatchButton();
    document.querySelector(`.robot-card[data-id="${id}"]`)?.classList.toggle('selected');
}

function updateBatchButton() {
    const count = selectedRobots.size;
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('batchDeleteBtn').disabled = count === 0;
}

function batchDelete() {
    if (selectedRobots.size === 0) return;
    if (!confirm(`Delete ${selectedRobots.size} selected robot(s)?`)) return;

    allRobots = allRobots.filter(r => !selectedRobots.has(r.id));
    selectedRobots.clear();
    updateBatchButton();
    loadRobots();
    showMessage('Robot(s) deleted successfully');
    addLog('System', 'Batch delete completed');
}

function openModal(robot = null) {
    document.getElementById('modalTitle').innerHTML = `<i class="fas fa-robot"></i> ${robot ? 'Edit Robot' : 'Add Robot'}`;
    document.getElementById('robotId').value = robot ? robot.id : '';
    document.getElementById('robotName').value = robot ? robot.name : '';
    document.getElementById('robotAvatar').value = robot ? (robot.avatar || '') : '';
    document.getElementById('activeTimeStart').value = robot ? (robot.activeTimeStart || '08:00') : '08:00';
    document.getElementById('activeTimeEnd').value = robot ? (robot.activeTimeEnd || '22:00') : '22:00';
    document.getElementById('postFrequency').value = robot ? (robot.postFrequency || 60) : 60;
    document.getElementById('replyFrequency').value = robot ? (robot.replyFrequency || 30) : 30;
    document.getElementById('interests').value = robot ? (robot.interests || '') : '';
    document.getElementById('enabled').checked = robot ? robot.enabled : true;
    previewAvatar();
    document.getElementById('robotModal').classList.add('show');
}

function closeModal() {
    document.getElementById('robotModal').classList.remove('show');
}

function previewAvatar() {
    const url = document.getElementById('robotAvatar').value;
    const preview = document.getElementById('avatarPreview');
    if (url && url.trim()) {
        preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-robot\\'></i>'">`;
    } else {
        preview.innerHTML = '<i class="fas fa-robot"></i>';
    }
}

function editRobot(id) {
    const robot = allRobots.find(r => r.id === id);
    if (robot) {
        openModal(robot);
    }
}

document.getElementById('robotForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('robotId').value;
    const robot = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('robotName').value,
        avatar: document.getElementById('robotAvatar').value,
        activeTimeStart: document.getElementById('activeTimeStart').value,
        activeTimeEnd: document.getElementById('activeTimeEnd').value,
        postFrequency: parseInt(document.getElementById('postFrequency').value) || 60,
        replyFrequency: parseInt(document.getElementById('replyFrequency').value) || 30,
        interests: document.getElementById('interests').value,
        enabled: document.getElementById('enabled').checked,
        createdAt: id ? allRobots.find(r => r.id === parseInt(id))?.createdAt : new Date().toISOString(),
        posts: id ? allRobots.find(r => r.id === parseInt(id))?.posts || 0 : 0,
        replies: id ? allRobots.find(r => r.id === parseInt(id))?.replies || 0 : 0
    };

    if (id) {
        const index = allRobots.findIndex(r => r.id === parseInt(id));
        if (index !== -1) {
            allRobots[index] = robot;
        }
    } else {
        allRobots.push(robot);
    }

    closeModal();
    loadRobots();
    const action = id ? 'updated' : 'created';
    showMessage(`Robot ${action} successfully`);
    addLog(robot.name, `Robot ${action}`);
});

function toggleRobot(id) {
    const robot = allRobots.find(r => r.id === id);
    if (robot) {
        robot.enabled = !robot.enabled;
        loadRobots();
        const newStatus = robot.enabled ? 'enabled' : 'disabled';
        showMessage(`Robot ${newStatus} successfully`);
        addLog(robot.name, `Robot ${newStatus}`);
    }
}

function generatePost(id) {
    const robot = allRobots.find(r => r.id === id);
    if (robot) {
        robot.posts = (robot.posts || 0) + 1;
        showMessage('Post generated successfully');
        addLog(robot.name, 'Generated a post');
    }
}

function generateReply(id) {
    const robot = allRobots.find(r => r.id === id);
    if (robot) {
        robot.replies = (robot.replies || 0) + 1;
        showMessage('Reply generated successfully');
        addLog(robot.name, 'Generated a reply');
    }
}

function deleteRobot(id) {
    const robot = allRobots.find(r => r.id === id);
    if (!robot) return;
    if (!confirm(`Delete robot "${robot.name}"?`)) return;

    allRobots = allRobots.filter(r => r.id !== id);
    loadRobots();
    showMessage('Robot deleted successfully');
    addLog(robot.name, 'Robot deleted');
}

function showPage(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item')?.classList.add('active');

    document.querySelectorAll('.main-content').forEach(content => {
        content.classList.add('page-hidden');
    });

    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.remove('page-hidden');
    }

    if (page === 'logs') {
        loadLogs();
    }
}

function renderLogs() {
    const logsList = document.getElementById('logsList');
    if (!logsList) return;

    if (activityLogs.length === 0) {
        logsList.innerHTML = `
            <div class="log-item">
                <span class="log-time">--:--</span>
                <span class="log-robot">System</span>
                <span class="log-action">No recent activity</span>
            </div>
        `;
        return;
    }

    logsList.innerHTML = activityLogs.slice(0, 10).map(log => `
        <div class="log-item">
            <span class="log-time">${log.time}</span>
            <span class="log-robot">${log.robot}</span>
            <span class="log-action">${log.action}</span>
        </div>
    `).join('');
}

function loadLogs() {
    const logSearchInput = document.getElementById('logSearchInput')?.value.toLowerCase() || '';
    const logTypeFilter = document.getElementById('logTypeFilter')?.value || 'all';

    let filtered = activityLogs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(logSearchInput) ||
            log.robot.toLowerCase().includes(logSearchInput);
        const matchesType = logTypeFilter === 'all' || log.type === logTypeFilter;
        return matchesSearch && matchesType;
    });

    const logsFullList = document.getElementById('logsFullList');
    if (logsFullList) {
        if (filtered.length === 0) {
            logsFullList.innerHTML = `
                <div class="log-item">
                    <span class="log-time">--:--</span>
                    <span class="log-robot">System</span>
                    <span class="log-action">No logs found</span>
                </div>
            `;
        } else {
            logsFullList.innerHTML = filtered.map(log => `
                <div class="log-item">
                    <span class="log-time">${log.time}</span>
                    <span class="log-robot">${log.robot}</span>
                    <span class="log-action">${log.action}</span>
                </div>
            `).join('');
        }
    }
}

function addLog(robot, action) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const types = ['post', 'reply', 'robot'];
    activityLogs.unshift({
        time: timeStr,
        robot: robot,
        action: action,
        type: types[Math.floor(Math.random() * types.length)]
    });
    if (activityLogs.length > 50) activityLogs.pop();
    renderLogs();
}

function generateRandomPost() {
    const activeRobots = allRobots.filter(r => r.enabled);
    if (activeRobots.length === 0) {
        showMessage('No active robots available', 'error');
        return;
    }
    const randomRobot = activeRobots[Math.floor(Math.random() * activeRobots.length)];
    randomRobot.posts = (randomRobot.posts || 0) + 1;
    showMessage(`${randomRobot.name} generated a random post!`);
    addLog(randomRobot.name, 'Generated random post');
}

function toggleAllRobots() {
    const allEnabled = allRobots.every(r => r.enabled);
    allRobots.forEach(r => r.enabled = !allEnabled);
    loadRobots();
    showMessage(`All robots ${allEnabled ? 'disabled' : 'enabled'}!`);
    addLog('System', `Toggled all robots`);
}

function refreshAllData() {
    showMessage('Refreshing all data...');
    setTimeout(() => {
        loadRobots();
        showMessage('All data refreshed successfully!');
        addLog('System', 'Data refreshed');
    }, 800);
}

document.getElementById('searchInput')?.addEventListener('input', filterRobots);
document.getElementById('statusFilter')?.addEventListener('change', filterRobots);
document.getElementById('logSearchInput')?.addEventListener('input', loadLogs);
document.getElementById('logTypeFilter')?.addEventListener('change', loadLogs);

document.getElementById('cancelBtn').addEventListener('click', closeModal);

document.getElementById('logoutNav').addEventListener('click', () => {
    window.location.href = '../index.html';
});

document.getElementById('robotModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('robotModal')) closeModal();
});

function showWelcomeModal() {
    const welcomeModal = document.getElementById('welcomeModal');
    const currentTimeEl = document.getElementById('currentTime');

    // Set current time
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    currentTimeEl.textContent = timeStr;

    welcomeModal.classList.add('show');
}

function closeWelcomeModal() {
    const welcomeModal = document.getElementById('welcomeModal');
    welcomeModal.classList.remove('show');
}

// Close welcome modal when clicking outside
document.getElementById('welcomeModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('welcomeModal')) closeWelcomeModal();
});

loadRobots();
showWelcomeModal();
