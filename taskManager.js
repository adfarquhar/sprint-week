// taskManager.js - Handles all task-related functionality

import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    writeBatch,
    Timestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export class TaskManager {
    constructor(db) {
        this.db = db;
        this.allTasks = [];
        this.taskBoard = document.getElementById('task-board');
        this.progressBar = document.getElementById('progress-bar');
        this.addTaskModal = document.getElementById('add-task-modal');
        this.addTaskForm = document.getElementById('add-task-form');
        this.addTaskButton = document.getElementById('add-task-button');
        this.cancelTaskButton = document.getElementById('cancel-task-button');
        this.dailyResetButton = document.getElementById('daily-reset-button');
        this.exportButton = document.getElementById('export-button');
        
        // Debug log to check if elements are found
        if (!this.cancelTaskButton) {
            console.warn('Cancel button not found during TaskManager initialization');
        }
        
        this.initializeEventListeners();
        this.setupDragAndDrop();
    }

    initializeEventListeners() {
        // Add Task Button - open modal
        if (this.addTaskButton && this.addTaskModal) {
            this.addTaskButton.addEventListener('click', () => {
                console.log('Opening task modal');
                this.addTaskModal.classList.remove('hidden');
            });
        }

        // Cancel Task Button - close modal
        if (this.cancelTaskButton && this.addTaskModal && this.addTaskForm) {
            this.cancelTaskButton.addEventListener('click', () => {
                console.log('Closing task modal');
                this.addTaskModal.classList.add('hidden');
                this.addTaskForm.reset();
            });
        }

        // Add Task Form Submit
        if (this.addTaskForm) {
            this.addTaskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        }

        // Daily Reset Button
        if (this.dailyResetButton) {
            this.dailyResetButton.addEventListener('click', () => this.handleDailyReset());
        }

        // Export Button
        if (this.exportButton) {
            this.exportButton.addEventListener('click', () => this.exportTodaysTasks());
        }
    }

    async handleAddTask(e) {
        e.preventDefault();
        const title = this.addTaskForm['task-title'].value;
        const description = this.addTaskForm['task-description'].value;
        const timeEstimate = parseInt(this.addTaskForm['task-estimate'].value);
        const assignedTo = this.addTaskForm['task-assignee'].value;
        const priority = this.addTaskForm['task-priority'].value;
        const status = 'todo';

        try {
            await addDoc(collection(this.db, 'tasks'), {
                title,
                description,
                timeEstimate,
                assignedTo,
                priority,
                status,
                createdDate: serverTimestamp(),
                completedDate: null
            });
            this.addTaskModal.classList.add('hidden');
            this.addTaskForm.reset();
        } catch (error) {
            alert('Error adding task: ' + error.message);
        }
    }

    loadTasks() {
        const tasksCollectionRef = collection(this.db, 'tasks');
        const q = query(tasksCollectionRef, orderBy('createdDate', 'desc'));

        onSnapshot(q, (snapshot) => {
            this.clearTaskBoard();
            this.allTasks = [];
            
            snapshot.forEach(documentSnapshot => {
                const task = { id: documentSnapshot.id, ...documentSnapshot.data() };
                this.allTasks.push(task);
                this.renderTask(task);
            });
            
            this.updateProgressMeter();
        });
    }

    clearTaskBoard() {
        const columns = ['todo', 'inprogress', 'blocked', 'done'];
        columns.forEach(columnId => {
            const column = document.getElementById(columnId);
            if (column) {
                // Keep the header (first child), remove all task cards
                while (column.children.length > 1) {
                    column.removeChild(column.lastChild);
                }
            }
        });
    }

    renderTask(task) {
        const taskCard = this.createTaskCard(task);
        const column = document.getElementById(task.status);
        if (column) {
            column.appendChild(taskCard);
        }
    }

    createTaskCard(task) {
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card');
        taskCard.classList.add(`${task.priority}-priority`);
        taskCard.setAttribute('draggable', 'true');
        taskCard.dataset.id = task.id;

        let userColorClass = '';
        if (task.assignedTo === 'Real Estate Agent') {
            userColorClass = 'real-estate-agent';
        } else if (task.assignedTo === 'App Developer') {
            userColorClass = 'app-developer';
        }

        taskCard.innerHTML = `
            <h3>${task.title}</h3>
            <p>Estimate: ${task.timeEstimate}h</p>
            <p class="assigned-to ${userColorClass}">Assigned: ${task.assignedTo}</p>
            <p>Priority: ${task.priority}</p>
        `;

        // Drag event
        taskCard.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
        });

        return taskCard;
    }

    setupDragAndDrop() {
        this.taskBoard?.querySelectorAll('.task-column').forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;

                try {
                    const taskRef = doc(this.db, 'tasks', taskId);
                    await updateDoc(taskRef, {
                        status: newStatus,
                        completedDate: newStatus === 'done' ? serverTimestamp() : null
                    });
                } catch (error) {
                    console.error("Error updating task status:", error);
                }
            });
        });
    }

    updateProgressMeter() {
        const totalTasks = this.allTasks.length;
        const completedTasks = this.allTasks.filter(task => task.status === 'done').length;

        let percentage = 0;
        if (totalTasks > 0) {
            percentage = (completedTasks / totalTasks) * 100;
        }

        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
            this.progressBar.textContent = `${Math.round(percentage)}%`;
        }
    }

    async handleDailyReset() {
        if (!confirm("Are you sure you want to reset for the day? Completed tasks will be archived.")) {
            return;
        }

        const batch = writeBatch(this.db);
        const completedTasks = this.allTasks.filter(task => task.status === 'done');

        if (completedTasks.length === 0) {
            alert("No tasks to archive.");
            return;
        }

        const today = Timestamp.fromDate(new Date());
        completedTasks.forEach(task => {
            const archivedTaskRef = doc(collection(this.db, 'daily_archive'));
            batch.set(archivedTaskRef, { ...task, archivedDate: today });
            const taskRef = doc(this.db, 'tasks', task.id);
            batch.delete(taskRef);
        });

        try {
            await batch.commit();
            alert("Daily reset complete! Completed tasks archived.");
        } catch (error) {
            console.error("Error during daily reset:", error);
            alert("Error during daily reset. Check console for details.");
        }
    }

    exportTodaysTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedToday = this.allTasks.filter(task => {
            if (task.status === 'done' && task.completedDate) {
                const taskCompletedDate = task.completedDate.toDate();
                return taskCompletedDate >= today;
            }
            return false;
        });

        if (completedToday.length === 0) {
            alert("No tasks completed today to export.");
            return;
        }

        let summary = `Daily Accomplishments (${new Date().toLocaleDateString()}):\n\n`;
        completedToday.forEach(task => {
            summary += `- ${task.title} (Assigned: ${task.assignedTo}, Estimate: ${task.timeEstimate}h)\n`;
        });

        navigator.clipboard.writeText(summary).then(() => {
            alert("Today's accomplishments copied to clipboard!");
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert("Failed to copy to clipboard. Please check console.");
        });
    }
}