// ========================================
// TODOIST CLONE - JAVASCRIPT
// Complete functionality with localStorage
// ========================================

// State Management
let state = {
    projects: [
        { id: 'inbox', name: 'Inbox', type: 'default' },
        { id: 'today', name: 'Today', type: 'default' },
        { id: 'upcoming', name: 'Upcoming', type: 'default' }
    ],
    tasks: [],
    currentProject: 'inbox',
    editingTask: null
};

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initializeEventListeners();
    renderProjects();
    renderTasks();
    updateTaskCounts();
});

// ========================================
// LOCAL STORAGE
// ========================================

function saveToStorage() {
    try {
        localStorage.setItem('todoistClone', JSON.stringify({
            projects: state.projects,
            tasks: state.tasks,
            currentProject: state.currentProject
        }));
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem('todoistClone');
        if (stored) {
            const data = JSON.parse(stored);

            // Merge with default projects
            const defaultProjects = state.projects.filter(p => p.type === 'default');
            const customProjects = data.projects.filter(p => p.type !== 'default');
            state.projects = [...defaultProjects, ...customProjects];

            state.tasks = data.tasks || [];
            state.currentProject = data.currentProject || 'inbox';
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function initializeEventListeners() {
    // Menu toggle (mobile)
    document.getElementById('menuBtn').addEventListener('click', toggleSidebar);

    // Quick add button
    document.getElementById('quickAddBtn').addEventListener('click', showAddTaskForm);

    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', showAddTaskForm);

    // Task form actions
    document.getElementById('saveTaskBtn').addEventListener('click', saveTask);
    document.getElementById('cancelTaskBtn').addEventListener('click', hideAddTaskForm);
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveTask();
        }
    });

    // Task options
    document.getElementById('dueDateBtn').addEventListener('click', () => {
        document.getElementById('datePicker').classList.toggle('hidden');
    });

    document.getElementById('priorityBtn').addEventListener('click', () => {
        document.getElementById('priorityPicker').classList.toggle('hidden');
    });

    document.getElementById('datePicker').addEventListener('change', (e) => {
        const date = new Date(e.target.value);
        const formatted = formatDate(date);
        document.getElementById('dueDateText').textContent = formatted;
        document.getElementById('datePicker').classList.add('hidden');
    });

    document.getElementById('priorityPicker').addEventListener('change', (e) => {
        const priority = e.target.value;
        document.getElementById('priorityText').textContent = `Priority ${priority}`;
        document.getElementById('priorityPicker').classList.add('hidden');
    });

    // Project management
    document.getElementById('addProjectBtn').addEventListener('click', showAddProjectForm);
    document.getElementById('saveProjectBtn').addEventListener('click', saveProject);
    document.getElementById('cancelProjectBtn').addEventListener('click', hideAddProjectForm);
    document.getElementById('projectInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveProject();
        }
    });

    // Project toggle
    document.getElementById('projectsToggle').addEventListener('click', toggleProjects);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Quick add: Q key
        if (e.key === 'q' && !isInputFocused()) {
            e.preventDefault();
            showAddTaskForm();
        }
        // Escape: Close forms
        if (e.key === 'Escape') {
            hideAddTaskForm();
            hideAddProjectForm();
        }
    });
}

function isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement.tagName === 'INPUT' ||
           activeElement.tagName === 'TEXTAREA' ||
           activeElement.isContentEditable;
}

// ========================================
// SIDEBAR & NAVIGATION
// ========================================

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleProjects() {
    const toggle = document.getElementById('projectsToggle');
    const customProjects = document.getElementById('customProjects');
    toggle.classList.toggle('collapsed');
    customProjects.classList.toggle('hidden');
}

// ========================================
// PROJECTS
// ========================================

function renderProjects() {
    // Render default projects (already in HTML)
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(item => {
        item.addEventListener('click', () => {
            const projectId = item.dataset.projectId;
            switchProject(projectId);
        });
    });

    // Render custom projects
    const customProjectsContainer = document.getElementById('customProjects');
    const customProjects = state.projects.filter(p => p.type !== 'default');

    customProjectsContainer.innerHTML = customProjects.map(project => `
        <div class="custom-project-item ${state.currentProject === project.id ? 'active' : ''}"
             data-project-id="${project.id}">
            <span class="project-color" style="background-color: ${project.color || '#808080'}"></span>
            <span class="project-name">${escapeHtml(project.name)}</span>
            <span class="task-count" data-project="${project.id}">${getProjectTaskCount(project.id)}</span>
            <button class="delete-project-btn" onclick="deleteProject('${project.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Add event listeners to custom projects
    document.querySelectorAll('.custom-project-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-project-btn')) {
                const projectId = item.dataset.projectId;
                switchProject(projectId);
            }
        });
    });
}

function switchProject(projectId) {
    state.currentProject = projectId;

    // Update active state
    document.querySelectorAll('.project-item, .custom-project-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-project-id="${projectId}"]`).classList.add('active');

    // Update title
    const project = state.projects.find(p => p.id === projectId);
    document.getElementById('contentTitle').textContent = project ? project.name : 'Inbox';

    // Render tasks for this project
    renderTasks();

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }

    saveToStorage();
}

function showAddProjectForm() {
    document.getElementById('addProjectForm').classList.remove('hidden');
    document.getElementById('projectInput').focus();
}

function hideAddProjectForm() {
    document.getElementById('addProjectForm').classList.add('hidden');
    document.getElementById('projectInput').value = '';
}

function saveProject() {
    const input = document.getElementById('projectInput');
    const name = input.value.trim();

    if (!name) return;

    const newProject = {
        id: 'project_' + Date.now(),
        name: name,
        type: 'custom',
        color: getRandomColor()
    };

    state.projects.push(newProject);
    hideAddProjectForm();
    renderProjects();
    saveToStorage();
}

function deleteProject(projectId) {
    if (confirm('Delete this project and all its tasks?')) {
        // Remove project
        state.projects = state.projects.filter(p => p.id !== projectId);

        // Remove all tasks in this project
        state.tasks = state.tasks.filter(t => t.projectId !== projectId);

        // Switch to inbox if current project was deleted
        if (state.currentProject === projectId) {
            switchProject('inbox');
        }

        renderProjects();
        renderTasks();
        updateTaskCounts();
        saveToStorage();
    }
}

function getRandomColor() {
    const colors = ['#DE483A', '#FF9A14', '#5297FF', '#058527', '#750985', '#808080'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ========================================
// TASKS
// ========================================

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const tasks = getTasksForCurrentView();

    if (tasks.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 0; text-align: center; color: var(--color-text-tertiary);">
                <svg width="80" height="80" viewBox="0 0 24 24" style="opacity: 0.3; margin-bottom: 16px;">
                    <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <p>No tasks yet. Add one to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox ${getPriorityClass(task.priority)}"
                 onclick="toggleTaskComplete('${task.id}')"></div>
            <div class="task-content">
                <div class="task-name">${escapeHtml(task.name)}</div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                ${getTaskMeta(task)}
            </div>
            <div class="task-actions">
                <button class="task-action-btn" onclick="editTask('${task.id}')" title="Edit task">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="task-action-btn delete" onclick="deleteTask('${task.id}')" title="Delete task">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function getTasksForCurrentView() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = now.getTime();

    let tasks = state.tasks;

    if (state.currentProject === 'today') {
        tasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today;
        });
    } else if (state.currentProject === 'upcoming') {
        tasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() >= today;
        });
    } else {
        tasks = tasks.filter(task => task.projectId === state.currentProject);
    }

    // Sort: incomplete first, then by priority, then by due date
    return tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt - a.createdAt;
    });
}

function getTaskMeta(task) {
    const meta = [];

    if (task.dueDate) {
        const dateClass = getDueDateClass(task.dueDate);
        const formatted = formatDate(new Date(task.dueDate));
        meta.push(`
            <span class="task-due-date ${dateClass}">
                <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V10h16v11zm0-13H4V5h16v3z"/>
                </svg>
                ${formatted}
            </span>
        `);
    }

    if (task.priority && task.priority < 4) {
        meta.push(`
            <span class="task-priority">
                <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="${getPriorityColor(task.priority)}" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                </svg>
            </span>
        `);
    }

    return meta.length > 0 ? `<div class="task-meta">${meta.join('')}</div>` : '';
}

function getPriorityClass(priority) {
    if (!priority || priority === 4) return '';
    return `priority-${priority}`;
}

function getPriorityColor(priority) {
    const colors = {
        1: '#DE483A',
        2: '#FF9A14',
        3: '#5297FF',
        4: '#808080'
    };
    return colors[priority] || colors[4];
}

function getDueDateClass(dueDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = now.getTime();

    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    const taskTime = taskDate.getTime();

    if (taskTime < today) return 'overdue';
    if (taskTime === today) return 'today';
    return '';
}

function formatDate(date) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = now.getTime();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    const taskTime = taskDate.getTime();

    if (taskTime === today) return 'Today';
    if (taskTime === tomorrow.getTime()) return 'Tomorrow';

    const options = { month: 'short', day: 'numeric' };
    if (taskDate.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
    }

    return taskDate.toLocaleDateString('en-US', options);
}

function showAddTaskForm() {
    document.getElementById('addTaskForm').classList.remove('hidden');
    document.getElementById('addTaskBtn').classList.add('hidden');
    document.getElementById('taskInput').focus();
    state.editingTask = null;
}

function hideAddTaskForm() {
    document.getElementById('addTaskForm').classList.add('hidden');
    document.getElementById('addTaskBtn').classList.remove('hidden');

    // Clear form
    document.getElementById('taskInput').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('datePicker').value = '';
    document.getElementById('priorityPicker').value = '4';
    document.getElementById('dueDateText').textContent = 'Due date';
    document.getElementById('priorityText').textContent = 'Priority';

    state.editingTask = null;
}

function saveTask() {
    const nameInput = document.getElementById('taskInput');
    const descriptionInput = document.getElementById('taskDescription');
    const dateInput = document.getElementById('datePicker');
    const priorityInput = document.getElementById('priorityPicker');

    const name = nameInput.value.trim();
    if (!name) return;

    if (state.editingTask) {
        // Update existing task
        const task = state.tasks.find(t => t.id === state.editingTask);
        if (task) {
            task.name = name;
            task.description = descriptionInput.value.trim();
            task.dueDate = dateInput.value || null;
            task.priority = parseInt(priorityInput.value);
        }
    } else {
        // Create new task
        const newTask = {
            id: 'task_' + Date.now(),
            name: name,
            description: descriptionInput.value.trim(),
            projectId: state.currentProject === 'today' || state.currentProject === 'upcoming'
                ? 'inbox'
                : state.currentProject,
            dueDate: dateInput.value || null,
            priority: parseInt(priorityInput.value),
            completed: false,
            createdAt: Date.now()
        };

        state.tasks.push(newTask);
    }

    hideAddTaskForm();
    renderTasks();
    updateTaskCounts();
    saveToStorage();
}

function toggleTaskComplete(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
        updateTaskCounts();
        saveToStorage();
    }
}

function editTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.editingTask = taskId;

    // Fill form with task data
    document.getElementById('taskInput').value = task.name;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('datePicker').value = task.dueDate || '';
    document.getElementById('priorityPicker').value = task.priority || 4;

    if (task.dueDate) {
        document.getElementById('dueDateText').textContent = formatDate(new Date(task.dueDate));
    }
    if (task.priority && task.priority < 4) {
        document.getElementById('priorityText').textContent = `Priority ${task.priority}`;
    }

    // Show form
    document.getElementById('addTaskForm').classList.remove('hidden');
    document.getElementById('addTaskBtn').classList.add('hidden');
    document.getElementById('taskInput').focus();
    document.getElementById('saveTaskBtn').textContent = 'Save';
}

function deleteTask(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    renderTasks();
    updateTaskCounts();
    saveToStorage();
}

// ========================================
// TASK COUNTS
// ========================================

function updateTaskCounts() {
    state.projects.forEach(project => {
        const count = getProjectTaskCount(project.id);
        const countElement = document.querySelector(`[data-project="${project.id}"]`);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

function getProjectTaskCount(projectId) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = now.getTime();

    if (projectId === 'today') {
        return state.tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today;
        }).length;
    } else if (projectId === 'upcoming') {
        return state.tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() >= today;
        }).length;
    } else {
        return state.tasks.filter(task =>
            task.projectId === projectId && !task.completed
        ).length;
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Make functions globally available for inline event handlers
window.toggleTaskComplete = toggleTaskComplete;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.deleteProject = deleteProject;
