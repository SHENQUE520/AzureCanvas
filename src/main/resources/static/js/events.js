const STORAGE_KEY = 'events_data';
const CATEGORY_COLORS = {
    study: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    life: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
    emotion: 'linear-gradient(135deg, #c2185b 0%, #f06292 100%)',
    event: 'linear-gradient(135deg, #f57c00 0%, #ffa726 100%)'
};

const CATEGORY_ICONS = {
    study: '📚',
    life: '🍜',
    emotion: '💕',
    event: '🎉'
};

let allEvents = [];
let currentFilter = 'all';
let currentView = 'list';
let selectedEvents = new Set();
let currentMonth = new Date();

const defaultEvents = [
    {
        id: 1,
        title: '2024 Campus Music Festival',
        category: 'event',
        startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        endTime: new Date(Date.now() - 86400000).toISOString(),
        location: 'Main Lawn',
        description: 'Annual campus music festival featuring student bands and local artists. A day filled with great music, food, and fun activities for everyone.',
        image: '',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
    },
    {
        id: 2,
        title: 'Tech Workshop: JavaScript Basics',
        category: 'study',
        startTime: new Date(Date.now() + 3600000 * 2).toISOString(),
        endTime: new Date(Date.now() + 3600000 * 5).toISOString(),
        location: 'Computer Lab 301',
        description: 'Learn the fundamentals of JavaScript programming. Perfect for beginners who want to start their coding journey.',
        image: '',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
        id: 3,
        title: 'Career Fair 2024',
        category: 'event',
        startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 6).toISOString(),
        location: 'Student Center',
        description: 'Meet recruiters from top companies and explore internship and job opportunities. Don\'t forget to bring your resume!',
        image: '',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
        id: 4,
        title: 'Weekend Hiking Trip',
        category: 'life',
        startTime: new Date(Date.now() + 86400000 * 5).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 5 + 3600000 * 10).toISOString(),
        location: 'Coloane Trail',
        description: 'Join us for a refreshing hiking trip to Coloane. Enjoy nature and make new friends along the way.',
        image: '',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 5,
        title: 'Art Exhibition: Student Works',
        category: 'emotion',
        startTime: new Date(Date.now() - 86400000 * 7).toISOString(),
        endTime: new Date(Date.now() - 86400000 * 3).toISOString(),
        location: 'Art Gallery',
        description: 'Showcasing amazing artworks created by our talented students. Come and support your fellow artists!',
        image: '',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
        id: 6,
        title: 'Midnight Study Session',
        category: 'study',
        startTime: new Date(Date.now() - 3600000 * 3).toISOString(),
        endTime: new Date(Date.now() + 3600000 * 1).toISOString(),
        location: '24-hour Library',
        description: 'Group study session for upcoming exams. Coffee and snacks provided!',
        image: '',
        createdAt: new Date(Date.now() - 86400000).toISOString()
    }
];

function init() {
    loadFromStorage();
    if (allEvents.length === 0) {
        allEvents = [...defaultEvents];
        saveToStorage();
    }
    updateStats();
    renderEvents();
    setupEventListeners();
    checkUpcomingEvents();
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            allEvents = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));
    } catch (error) {
        console.error('Error saving events:', error);
    }
}

function getEventStatus(event) {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now < start) {
        return 'upcoming';
    } else if (now >= start && now <= end) {
        return 'ongoing';
    } else {
        return 'past';
    }
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function showMessage(text, type = 'success') {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    setTimeout(() => {
        message.style.display = 'none';
    }, 3000);
}

function showNotification(title, content) {
    const notification = document.getElementById('notification');
    notification.innerHTML = `
        <div class="notification-header">
            <i class="fas fa-bell"></i>
            <h4>${title}</h4>
        </div>
        <div class="notification-content">${content}</div>
    `;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function checkUpcomingEvents() {
    const now = new Date();
    allEvents.forEach(event => {
        const start = new Date(event.startTime);
        const diffHours = (start - now) / (1000 * 60 * 60);
        
        if (diffHours > 0 && diffHours <= 24) {
            showNotification(
                'Upcoming Event!',
                `${event.title} is starting in ${Math.round(diffHours)} hour(s)`
            );
        }
    });
}

function updateStats() {
    let upcoming = 0, ongoing = 0, past = 0;

    allEvents.forEach(event => {
        const status = getEventStatus(event);
        if (status === 'upcoming') upcoming++;
        else if (status === 'ongoing') ongoing++;
        else past++;
    });

    document.getElementById('upcomingCount').textContent = upcoming;
    document.getElementById('ongoingCount').textContent = ongoing;
    document.getElementById('pastCount').textContent = past;
    document.getElementById('totalEvents').textContent = allEvents.length;
    
    renderCharts();
}

function getFilteredEvents() {
    let filtered = [...allEvents];
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    if (searchInput) {
        filtered = filtered.filter(event => 
            event.title.toLowerCase().includes(searchInput) ||
            (event.description && event.description.toLowerCase().includes(searchInput)) ||
            (event.location && event.location.toLowerCase().includes(searchInput))
        );
    }

    if (categoryFilter !== 'all') {
        filtered = filtered.filter(event => event.category === categoryFilter);
    }

    if (currentFilter !== 'all') {
        filtered = filtered.filter(event => getEventStatus(event) === currentFilter);
    }

    if (dateFrom) {
        filtered = filtered.filter(event => new Date(event.startTime) >= new Date(dateFrom));
    }

    if (dateTo) {
        filtered = filtered.filter(event => new Date(event.startTime) <= new Date(dateTo));
    }

    filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    return filtered;
}

function renderEvents() {
    const events = getFilteredEvents();
    
    document.getElementById('eventsList').style.display = 'none';
    document.getElementById('timelineView').style.display = 'none';
    document.getElementById('calendarView').style.display = 'none';

    switch (currentView) {
        case 'list':
            renderListView(events);
            break;
        case 'timeline':
            renderTimelineView(events);
            break;
        case 'calendar':
            renderCalendarView(events);
            break;
    }
}

function renderListView(events) {
    const container = document.getElementById('eventsList');
    container.style.display = 'flex';

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h2>No events found</h2>
                <p>Try adjusting your filters or add a new event</p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => {
        const status = getEventStatus(event);
        const config = CATEGORY_ICONS[event.category] || '📅';
        const isSelected = selectedEvents.has(event.id);
        
        return `
            <div class="event-card ${status} ${isSelected ? 'selected' : ''}" data-id="${event.id}">
                <input type="checkbox" class="event-checkbox" 
                    ${isSelected ? 'checked' : ''} 
                    onchange="toggleSelect(${event.id}, event)">
                <div class="event-image">
                    ${event.image 
                        ? `<img src="${event.image}" alt="${event.title}">`
                        : `<i class="fas fa-calendar-alt"></i>`
                    }
                </div>
                <div class="event-content">
                    <div class="event-header">
                        <div class="event-title">
                            ${config} ${event.title}
                        </div>
                        <span class="event-status ${status}">${status}</span>
                    </div>
                    <span class="event-category category-${event.category}">${event.category}</span>
                    <p class="event-description">${event.description || 'No description'}</p>
                    <div class="event-meta">
                        <span><i class="fas fa-clock"></i> ${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}</span>
                        ${event.location ? `<span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>` : ''}
                    </div>
                    <div class="event-actions">
                        <button class="btn-view" onclick="viewEvent(${event.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn-edit" onclick="editEvent(${event.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="deleteEvent(${event.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderTimelineView(events) {
    const container = document.getElementById('timelineView');
    container.style.display = 'block';

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h2>No events found</h2>
                <p>Try adjusting your filters or add a new event</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="timeline">
            ${events.map(event => {
                const status = getEventStatus(event);
                const config = CATEGORY_ICONS[event.category] || '📅';
                
                return `
                    <div class="timeline-item" onclick="viewEvent(${event.id})">
                        <div class="timeline-date">${formatDateTime(event.startTime)}</div>
                        <div class="timeline-title">${config} ${event.title}</div>
                        <div class="timeline-description">${event.description || 'No description'}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderCalendarView(events) {
    const container = document.getElementById('calendarView');
    container.style.display = 'block';

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('calendarTitle').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    let calendarHTML = `
        <div class="calendar-day-header">Sun</div>
        <div class="calendar-day-header">Mon</div>
        <div class="calendar-day-header">Tue</div>
        <div class="calendar-day-header">Wed</div>
        <div class="calendar-day-header">Thu</div>
        <div class="calendar-day-header">Fri</div>
        <div class="calendar-day-header">Sat</div>
    `;

    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const isToday = today.getDate() === day && 
                        today.getMonth() === month && 
                        today.getFullYear() === year;
        
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.getDate() === day &&
                   eventDate.getMonth() === month &&
                   eventDate.getFullYear() === year;
        });

        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}">
                <div class="calendar-day-number">${day}</div>
                ${dayEvents.slice(0, 3).map(event => `
                    <div class="calendar-event ${getEventStatus(event)}" 
                         onclick="viewEvent(${event.id})" 
                         title="${event.title}">
                        ${CATEGORY_ICONS[event.category] || '📅'} ${event.title.substring(0, 15)}${event.title.length > 15 ? '...' : ''}
                    </div>
                `).join('')}
                ${dayEvents.length > 3 ? `<div style="font-size: 11px; color: #666;">+${dayEvents.length - 3} more</div>` : ''}
            </div>
        `;
    }

    document.getElementById('calendarGrid').innerHTML = calendarHTML;
}

function renderCharts() {
    const categoryCounts = { study: 0, life: 0, emotion: 0, event: 0 };
    const statusCounts = { upcoming: 0, ongoing: 0, past: 0 };

    allEvents.forEach(event => {
        categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
        const status = getEventStatus(event);
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const totalCategories = allEvents.length || 1;
    document.getElementById('categoryChart').innerHTML = Object.entries(categoryCounts).map(([key, count]) => `
        <div class="chart-bar">
            <div class="chart-label">
                ${CATEGORY_ICONS[key]} ${key}
            </div>
            <div class="chart-bar-wrapper">
                <div class="chart-bar-fill" style="width: ${(count / totalCategories * 100)}%; background: ${CATEGORY_COLORS[key]};">
                    ${count}
                </div>
            </div>
        </div>
    `).join('');

    const totalStatus = allEvents.length || 1;
    const statusColors = {
        upcoming: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        ongoing: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        past: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    };
    
    document.getElementById('statusChart').innerHTML = Object.entries(statusCounts).map(([key, count]) => `
        <div class="chart-bar">
            <div class="chart-label">
                ${key}
            </div>
            <div class="chart-bar-wrapper">
                <div class="chart-bar-fill" style="width: ${(count / totalStatus * 100)}%; background: ${statusColors[key]};">
                    ${count}
                </div>
            </div>
        </div>
    `).join('');
}

function openModal(event = null) {
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('modalTitle');
    
    document.getElementById('eventForm').reset();
    
    if (event) {
        title.innerHTML = '<i class="fas fa-edit"></i> Edit Event';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventCategory').value = event.category;
        
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        
        document.getElementById('eventStart').value = startDate.toISOString().slice(0, 16);
        document.getElementById('eventEnd').value = endDate.toISOString().slice(0, 16);
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventImage').value = event.image || '';
    } else {
        title.innerHTML = '<i class="fas fa-calendar-plus"></i> Add Event';
        document.getElementById('eventId').value = '';
    }
    
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('eventModal').classList.remove('show');
}

function viewEvent(id) {
    const event = allEvents.find(e => e.id === id);
    if (event) {
        alert(`${event.title}\n\n${event.description}\n\nLocation: ${event.location || 'TBD'}\nTime: ${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}`);
    }
}

function editEvent(id) {
    const event = allEvents.find(e => e.id === id);
    if (event) {
        openModal(event);
    }
}

function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        allEvents = allEvents.filter(e => e.id !== id);
        selectedEvents.delete(id);
        saveToStorage();
        updateStats();
        renderEvents();
        showMessage('Event deleted successfully!');
    }
}

function toggleSelect(id, event) {
    event.stopPropagation();
    if (selectedEvents.has(id)) {
        selectedEvents.delete(id);
    } else {
        selectedEvents.add(id);
    }
    updateBatchActions();
    renderEvents();
}

function updateBatchActions() {
    const batchActions = document.getElementById('batchActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedEvents.size > 0) {
        batchActions.style.display = 'flex';
        selectedCount.textContent = selectedEvents.size;
    } else {
        batchActions.style.display = 'none';
    }
}

function batchDelete() {
    if (confirm(`Are you sure you want to delete ${selectedEvents.size} selected event(s)?`)) {
        allEvents = allEvents.filter(e => !selectedEvents.has(e.id));
        selectedEvents.clear();
        saveToStorage();
        updateStats();
        renderEvents();
        updateBatchActions();
        showMessage('Events deleted successfully!');
    }
}

function exportEvents() {
    const dataStr = JSON.stringify(allEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `events_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage('Events exported successfully!');
}

function importEvents(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedEvents = JSON.parse(e.target.result);
            if (Array.isArray(importedEvents)) {
                const maxId = allEvents.length > 0 ? Math.max(...allEvents.map(e => e.id)) : 0;
                importedEvents.forEach((event, index) => {
                    event.id = maxId + index + 1;
                    if (!event.createdAt) {
                        event.createdAt = new Date().toISOString();
                    }
                });
                allEvents = [...allEvents, ...importedEvents];
                saveToStorage();
                updateStats();
                renderEvents();
                showMessage(`Successfully imported ${importedEvents.length} events!`);
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            showMessage('Error importing events. Please check the file format.', 'error');
        }
        document.getElementById('importModal').classList.remove('show');
    };
    reader.readAsText(file);
}

function openImportModal() {
    document.getElementById('importModal').classList.add('show');
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('show');
}

function showWelcomeModal() {
    const welcomeModal = document.getElementById('welcomeModal');
    const currentTimeEl = document.getElementById('currentTime');
    
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
    document.getElementById('welcomeModal').classList.remove('show');
}

function setupEventListeners() {
    document.getElementById('addEventBtn').addEventListener('click', () => openModal());
    
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    document.getElementById('eventModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('eventModal')) closeModal();
    });
    
    document.getElementById('eventForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('eventId').value;
        const eventData = {
            id: id ? parseInt(id) : Date.now(),
            title: document.getElementById('eventTitle').value,
            category: document.getElementById('eventCategory').value,
            startTime: new Date(document.getElementById('eventStart').value).toISOString(),
            endTime: new Date(document.getElementById('eventEnd').value).toISOString(),
            location: document.getElementById('eventLocation').value,
            description: document.getElementById('eventDescription').value,
            image: document.getElementById('eventImage').value,
            createdAt: id 
                ? allEvents.find(e => e.id === parseInt(id))?.createdAt 
                : new Date().toISOString()
        };
        
        if (id) {
            const index = allEvents.findIndex(e => e.id === parseInt(id));
            if (index !== -1) {
                allEvents[index] = eventData;
            }
            showMessage('Event updated successfully!');
        } else {
            allEvents.push(eventData);
            showMessage('Event added successfully!');
        }
        
        saveToStorage();
        closeModal();
        updateStats();
        renderEvents();
        checkUpcomingEvents();
    });
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.status;
            renderEvents();
        });
    });
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            renderEvents();
        });
    });
    
    document.getElementById('searchInput').addEventListener('input', () => {
        renderEvents();
        const clearBtn = document.getElementById('searchClear');
        clearBtn.style.display = document.getElementById('searchInput').value ? 'block' : 'none';
    });
    
    document.getElementById('searchClear').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchClear').style.display = 'none';
        renderEvents();
    });
    
    document.getElementById('categoryFilter').addEventListener('change', renderEvents);
    document.getElementById('dateFrom').addEventListener('change', renderEvents);
    document.getElementById('dateTo').addEventListener('change', renderEvents);
    
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchClear').style.display = 'none';
        renderEvents();
    });
    
    document.getElementById('refreshBtn').addEventListener('click', function() {
        this.classList.add('loading');
        setTimeout(() => {
            updateStats();
            renderEvents();
            this.classList.remove('loading');
            showMessage('Data refreshed!');
        }, 500);
    });
    
    document.getElementById('batchDeleteBtn').addEventListener('click', batchDelete);
    
    document.getElementById('exportBtn').addEventListener('click', exportEvents);
    
    document.getElementById('importBtn').addEventListener('click', openImportModal);
    
    document.getElementById('cancelImportBtn').addEventListener('click', closeImportModal);
    
    document.getElementById('confirmImportBtn').addEventListener('click', () => {
        const fileInput = document.getElementById('importFile');
        if (fileInput.files.length > 0) {
            importEvents(fileInput.files[0]);
        } else {
            showMessage('Please select a file first', 'error');
        }
    });
    
    document.getElementById('importModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('importModal')) closeImportModal();
    });
    
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderEvents();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderEvents();
    });
    
    document.getElementById('logoutNav').addEventListener('click', () => {
        window.location.href = '../index.html';
    });
}

setInterval(() => {
    updateStats();
    if (currentView === 'list') {
        renderEvents();
    }
}, 60000);

init();

const hasVisited = sessionStorage.getItem('events_welcome_shown');
if (!hasVisited) {
    showWelcomeModal();
    sessionStorage.setItem('events_welcome_shown', 'true');
}
