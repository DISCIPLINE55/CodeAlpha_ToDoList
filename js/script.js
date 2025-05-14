// TaskMaster Pro - Advanced To-Do List Application
// Merged Implementation

// Task class to create task objects
class Task {
    constructor(id, text, completed = false, priority = "medium", dueDate = null, createdAt = new Date()) {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.priority = priority;
        this.dueDate = dueDate;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    }
}

// TaskMaster application class
class TaskMaster {
    constructor() {
        // Core app state
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.darkMode = false;
        this.overdueNotified = false;
        
        // DOM Elements
        this.taskInput = document.getElementById('task-input');
        this.addBtn = document.getElementById('add-btn');
        this.taskList = document.getElementById('task-list');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.totalTasksEl = document.getElementById('total-tasks');
        this.completedTasksEl = document.getElementById('completed-tasks');
        this.remainingTasksEl = document.getElementById('remaining-tasks');
        this.themeToggle = document.getElementById('theme-toggle');
        this.currentDateEl = document.getElementById('current-date');
        this.taskModal = document.getElementById('task-modal');
        this.editTaskInput = document.getElementById('edit-task-input');
        this.editPriority = document.getElementById('edit-priority');
        this.editDueDate = document.getElementById('edit-due-date');
        this.closeModal = document.querySelector('.close-modal');
        this.cancelBtn = document.querySelector('.cancel-btn');
        this.saveBtn = document.querySelector('.save-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.importInput = document.getElementById('import-input');
        this.notification = document.getElementById('notification');
        this.notificationMessage = document.getElementById('notification-message');
        this.clearCompletedBtn = document.querySelector('.clear-completed-btn');
        
        // Initialize
        this.loadTasks();
        this.loadTheme();
        this.setCurrentDate();
        this.renderTasks();
        this.updateStats();
        this.checkOverdueTasks();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set interval for date and overdue tasks check
        setInterval(() => {
            this.setCurrentDate();
            this.checkOverdueTasks();
        }, 60000); // Every minute
    }
    
    // Load tasks from localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            this.tasks = parsedTasks.map(task => {
                // Convert string dates back to Date objects
                if (task.createdAt) task.createdAt = new Date(task.createdAt);
                if (task.dueDate && task.dueDate !== null) task.dueDate = new Date(task.dueDate);
                return new Task(
                    task.id,
                    task.text,
                    task.completed,
                    task.priority || 'medium',
                    task.dueDate,
                    task.createdAt
                );
            });
        }
    }
    
    // Set up all event listeners
    setupEventListeners() {
        // Add task events
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterTasks(btn.getAttribute('data-filter'));
            });
        });
        
        // Modal events
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.cancelBtn.addEventListener('click', () => this.closeEditModal());
        this.saveBtn.addEventListener('click', () => this.saveEditedTask());
        
        // Modal event to prevent closing when clicking inside modal content
        this.taskModal.addEventListener('click', (e) => {
            if (e.target === this.taskModal) {
                this.closeEditModal();
            }
        });
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Export/Import
        this.exportBtn.addEventListener('click', () => this.exportTasks());
        this.importInput.addEventListener('change', (e) => this.importTasks(e));
        
        // Clear completed tasks
        if (this.clearCompletedBtn) {
            this.clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());
        }
    }
    
    // Generate unique ID for tasks
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2);
    }
    
    // Add new task
    addTask() {
        const taskText = this.taskInput.value.trim();
        if (!taskText) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const newTask = new Task(
            this.generateId(),
            taskText
        );

        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.taskInput.value = '';
        this.showNotification('Task added successfully!', 'success');
    }
    
    // Delete task
    deleteTask(id) {
        if (!confirm("Are you sure you want to delete this task?")) return;
        
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task deleted successfully!', 'success');
    }
    
    // Toggle task completion
    toggleTaskCompletion(id) {
        this.tasks = this.tasks.map(task => {
            if (task.id === id) {
                task.completed = !task.completed;
            }
            return task;
        });
        
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        const task = this.tasks.find(t => t.id === id);
        const status = task.completed ? 'completed' : 'active';
        this.showNotification(`Task marked as ${status}!`, 'success');
    }
    
    // Open edit modal
    openEditModal(id) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        this.editingTaskId = id;
        this.editTaskInput.value = task.text;
        this.editPriority.value = task.priority || 'medium';
        
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const year = dueDate.getFullYear();
            const month = String(dueDate.getMonth() + 1).padStart(2, '0');
            const day = String(dueDate.getDate()).padStart(2, '0');
            this.editDueDate.value = `${year}-${month}-${day}`;
        } else {
            this.editDueDate.value = '';
        }

        this.taskModal.style.display = 'flex';
        this.editTaskInput.focus();
    }
    
    // Close edit modal
    closeEditModal() {
        this.taskModal.style.display = 'none';
        this.editingTaskId = null;
    }
    
    // Save edited task
    saveEditedTask() {
        if (!this.editingTaskId) return;
        
        const taskText = this.editTaskInput.value.trim();
        if (!taskText) {
            this.showNotification('Task description cannot be empty!', 'error');
            return;
        }

        this.tasks = this.tasks.map(task => {
            if (task.id === this.editingTaskId) {
                task.text = taskText;
                task.priority = this.editPriority.value;
                task.dueDate = this.editDueDate.value ? new Date(this.editDueDate.value) : null;
            }
            return task;
        });

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeEditModal();
        this.showNotification('Task updated successfully!', 'success');
    }
    
    // Filter tasks
    filterTasks(filter) {
        this.currentFilter = filter;
        
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
        });
        
        this.renderTasks();
    }
    
    // Render tasks based on current filter
    renderTasks() {
        let filteredTasks = [];
        
        switch(this.currentFilter) {
            case 'active':
                filteredTasks = this.tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => task.completed);
                break;
            default:
                filteredTasks = [...this.tasks];
        }
        
        // Sort tasks:
        // 1. Uncompleted first
        // 2. By priority (high to low)
        // 3. By due date (if present)
        // 4. By creation date (newest first)
        filteredTasks.sort((a, b) => {
            // First by completion status
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // Then by priority
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            
            // Then by due date
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            
            // Tasks with due dates come first
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            
            // Finally by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Clear task list
        this.taskList.innerHTML = '';
        
        // Show message if no tasks
        if (filteredTasks.length === 0) {
            const message = this.currentFilter === 'all' ? 
                'No tasks yet. Add a task to get started!' : 
                `No ${this.currentFilter} tasks to display.`;
                
            this.taskList.innerHTML = `<li class="empty-message">${message}</li>`;
            return;
        }
        
        // Generate task items
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority}`;
            if (task.completed) {
                li.classList.add('completed-task');
            }
            
            // Format due date if exists
            let dueDateHTML = '';
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                
                const options = { month: 'short', day: 'numeric', year: 'numeric' };
                const formattedDate = dueDate.toLocaleDateString('en-US', options);
                
                let dueDateClass = '';
                if (dueDate < today && !task.completed) {
                    dueDateClass = ' overdue';
                }
                
                dueDateHTML = `
                    <div class="task-due-date${dueDateClass}">
                        <i class="fas fa-calendar-day"></i> ${formattedDate}
                    </div>
                `;
            }
            
            // Format creation date
            const createdDate = new Date(task.createdAt);
            const createdFormatted = createdDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            // Priority label
            const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-info">
                        <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                        <div class="task-meta">
                            <div class="task-priority priority-badge-${task.priority}">
                                <i class="fas fa-flag"></i> ${priorityLabel}
                            </div>
                            <div class="task-created">
                                <i class="fas fa-calendar-plus"></i> ${createdFormatted}
                            </div>
                            ${dueDateHTML}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" data-id="${task.id}" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete-btn" data-id="${task.id}" title="Delete task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTaskCompletion(task.id));
            
            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => this.openEditModal(task.id));
            
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            
            this.taskList.appendChild(li);
        });
    }
    
    // Update statistics display
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const remainingTasks = totalTasks - completedTasks;
        
        this.totalTasksEl.textContent = `${totalTasks} task${totalTasks !== 1 ? 's' : ''}`;
        this.completedTasksEl.textContent = `${completedTasks} completed`;
        this.remainingTasksEl.textContent = `${remainingTasks} remaining`;
    }
    
    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    // Check for overdue tasks
    checkOverdueTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find all active tasks with due dates in the past
        const overdueTasks = this.tasks.filter(task => {
            if (!task.completed && task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate < today;
            }
            return false;
        });
        
        // Notify if there are overdue tasks and we haven't already notified
        if (overdueTasks.length > 0 && !this.overdueNotified) {
            this.showNotification(`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}!`, 'warning');
            this.overdueNotified = true;
            
            // Reset notification flag after 12 hours
            setTimeout(() => {
                this.overdueNotified = false;
            }, 12 * 60 * 60 * 1000);
        }
    }
    
    // Set current date in header
    setCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        this.currentDateEl.textContent = today.toLocaleDateString('en-US', options);
    }
    
    // Toggle theme (light/dark)
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        this.darkMode = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkMode', this.darkMode);
        
        // Update icon
        this.themeToggle.innerHTML = this.darkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
    
    // Load theme from localStorage
    loadTheme() {
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        if (this.darkMode) {
            document.body.classList.add('dark-theme');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    // Show notification
    showNotification(message, type = 'success') {
        this.notification.className = `notification show ${type}`;
        this.notificationMessage.textContent = message;
        
        // Set appropriate icon based on notification type
        const iconClass = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        const notificationIcon = this.notification.querySelector('i');
        if (notificationIcon) {
            notificationIcon.className = `fas ${iconClass[type] || iconClass.info}`;
        }
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
    
    // Export tasks to JSON file
    exportTasks() {
        if (this.tasks.length === 0) {
            this.showNotification('No tasks to export!', 'warning');
            return;
        }
        
        const tasksJSON = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([tasksJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", `taskmaster-backup-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
        
        this.showNotification('Tasks exported successfully!', 'success');
    }
    
    // Import tasks from JSON file
    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedTasks)) {
                    throw new Error('Invalid task data format');
                }
                
                // Ask if user wants to merge or replace tasks
                const confirmReplace = confirm('Do you want to replace all existing tasks? Click OK to replace, or Cancel to merge.');
                
                if (confirmReplace) {
                    // Replace all tasks
                    this.tasks = importedTasks.map(task => {
                        // Convert string dates back to Date objects
                        if (task.createdAt) task.createdAt = new Date(task.createdAt);
                        if (task.dueDate && task.dueDate !== null) task.dueDate = new Date(task.dueDate);
                        return new Task(
                            task.id || this.generateId(),
                            task.text,
                            task.completed,
                            task.priority || 'medium',
                            task.dueDate,
                            task.createdAt
                        );
                    });
                } else {
                    // Merge with existing tasks
                    importedTasks.forEach(task => {
                        const newTask = new Task(
                            this.generateId(), // New ID to avoid conflicts
                            task.text,
                            task.completed,
                            task.priority || 'medium',
                            task.dueDate ? new Date(task.dueDate) : null,
                            task.createdAt ? new Date(task.createdAt) : new Date()
                        );
                        this.tasks.push(newTask);
                    });
                }
                
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showNotification('Tasks imported successfully!', 'success');
                
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Failed to import tasks: Invalid file format', 'error');
            }
            
            // Reset the file input
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }
    
    // Clear all completed tasks
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'warning');
            return;
        }
        
        const confirmClear = confirm(`Are you sure you want to delete all ${completedCount} completed tasks?`);
        if (!confirmClear) return;
        
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Completed tasks cleared successfully!', 'success');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const app = new TaskMaster();
    
    // Add a "Clear Completed" button if it doesn't exist in HTML
    const filtersContainer = document.querySelector('.filters');
    if (filtersContainer && !document.querySelector('.clear-completed-btn')) {
        const clearCompletedBtn = document.createElement('button');
        clearCompletedBtn.className = 'filter-btn clear-completed-btn';
        clearCompletedBtn.innerHTML = '<i class="fas fa-trash"></i> Clear Completed';
        clearCompletedBtn.addEventListener('click', () => app.clearCompletedTasks());
        filtersContainer.appendChild(clearCompletedBtn);
    }
});