// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, orderBy, onSnapshot, query, Timestamp, FieldValue, writeBatch, getDocs } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5Q8rbBb-ycOTEsnubglaj7sF_1Ehgm0A",
  authDomain: "sister-sprint-week.firebaseapp.com",
  projectId: "sister-sprint-week",
  storageBucket: "sister-sprint-week.firebasestorage.app",
  messagingSenderId: "13328794283",
  appId: "1:13328794283:web:615b1d386b97b8ebf2edee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const userProfile = document.getElementById('user-profile');
const addTaskButton = document.getElementById('add-task-button');
const addTaskModal = document.getElementById('add-task-modal');
const addTaskForm = document.getElementById('add-task-form');
const cancelTaskButton = document.getElementById('cancel-task-button');
const taskBoard = document.getElementById('task-board');
const dailyResetButton = document.getElementById('daily-reset-button');
const exportButton = document.getElementById('export-button');
const progressMeter = document.getElementById('progress-meter');
const progressBar = document.getElementById('progress-bar');
const sprintVelocityChart = document.getElementById('sprint-velocity-chart');

// Pomodoro Timer Elements
const pomodoroDisplay = document.getElementById('pomodoro-display');
const startPomodoroButton = document.getElementById('start-pomodoro');
const resetPomodoroButton = document.getElementById('reset-pomodoro');

// Excuse Tracker Elements
const excuseTrackerContainer = document.getElementById('excuse-tracker-container');
const addExcuseForm = document.getElementById('add-excuse-form');
const excuseTextarea = document.getElementById('excuse-text');
const excuseAssigneeSelect = document.getElementById('excuse-assignee');
const excusesList = document.getElementById('excuses-list');

// Authentication State Listener
onAuthStateChanged(auth, user => {
    if (user) {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        userProfile.textContent = `Welcome, ${user.email}`;
        loadTasks();
        loadSprintVelocity();
        loadExcuses(); // Load excuses when user logs in
    } else {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm['email'].value;
    const password = loginForm['password'].value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert(error.message);
    }
});

// Logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert(error.message);
    }
});

// Add Task Modal
addTaskButton.addEventListener('click', () => {
    addTaskModal.classList.remove('hidden');
});

cancelTaskButton.addEventListener('click', () => {
    addTaskModal.classList.add('hidden');
    addTaskForm.reset();
});

// Add Task
addTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = addTaskForm['task-title'].value;
    const description = addTaskForm['task-description'].value;
    const timeEstimate = parseInt(addTaskForm['task-estimate'].value);
    const assignedTo = addTaskForm['task-assignee'].value;
    const priority = addTaskForm['task-priority'].value;
    const status = 'todo'; // New tasks start in 'To Do Today'

    try {
        await addDoc(collection(db, 'tasks'), {
            title,
            description,
            timeEstimate,
            assignedTo,
            priority,
            status,
            createdDate: FieldValue.serverTimestamp(),
            completedDate: null
        });
        addTaskModal.classList.add('hidden');
        addTaskForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

// Load Tasks from Firestore
let allTasks = []; // To store all tasks for progress meter and export
function loadTasks() {
    const tasksCollectionRef = collection(db, 'tasks');
    const q = query(tasksCollectionRef, orderBy('createdDate', 'desc'));

    onSnapshot(q, (snapshot) => {
        const todoColumn = document.getElementById('todo');
        const inprogressColumn = document.getElementById('inprogress');
        const blockedColumn = document.getElementById('blocked');
        const doneColumn = document.getElementById('done');

        // Clear existing tasks (except headers)
        Array.from(taskBoard.children).forEach(column => {
            while (column.children.length > 1) { // Keep the h2
                column.removeChild(column.lastChild);
            }
        });

        allTasks = []; // Reset allTasks array
        snapshot.forEach(documentSnapshot => {
            const task = { id: documentSnapshot.id, ...documentSnapshot.data() };
            allTasks.push(task);
            const taskCard = createTaskCard(task);
            if (task.status === 'todo') {
                todoColumn.appendChild(taskCard);
            } else if (task.status === 'inprogress') {
                inprogressColumn.appendChild(taskCard);
            } else if (task.status === 'blocked') {
                blockedColumn.appendChild(taskCard);
            } else if (task.status === 'done') {
                doneColumn.appendChild(taskCard);
            }
        });
        updateProgressMeter();
    });
}

// Create Task Card HTML
function createTaskCard(task) {
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

    // Drag and Drop Events
    taskCard.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
    });

    return taskCard;
}

// Drag and Drop for Columns
taskBoard.querySelectorAll('.task-column').forEach(column => {
    column.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow drop
    });

    column.addEventListener('drop', async (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = column.dataset.status;

        try {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, {
                status: newStatus,
                completedDate: newStatus === 'done' ? FieldValue.serverTimestamp() : null
            });
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    });
});

// Daily Standup Timer
let timerInterval;
const timerDisplay = document.getElementById('timer');
const standupPrompts = document.getElementById('standup-prompts');
const startTimerButton = document.createElement('button');
startTimerButton.textContent = 'Start Standup';
startTimerButton.addEventListener('click', startStandupTimer);
document.getElementById('timer-container').prepend(startTimerButton);

function startStandupTimer() {
    let timeLeft = 15 * 60; // 15 minutes in seconds

    timerDisplay.textContent = formatTime(timeLeft);
    standupPrompts.innerHTML = `
        <p>Real Estate Agent: What did you do yesterday? What will you do today? Any blockers?</p>
        <p>App Developer: What did you do yesterday? What will you do today? Any blockers?</p>
    `;
    startTimerButton.disabled = true; // Disable button while timer is running

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = formatTime(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "Time's Up!";
            standupPrompts.innerHTML = "<p>Standup finished!</p>";
            startTimerButton.disabled = false;
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Pomodoro Timer Logic
let pomodoroInterval;
let pomodoroTimeLeft;
let isWorkTime = true;
const WORK_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60;  // 5 minutes

function startPomodoroTimer() {
    if (!pomodoroInterval) {
        pomodoroTimeLeft = isWorkTime ? WORK_TIME : BREAK_TIME;
        pomodoroDisplay.textContent = formatTime(pomodoroTimeLeft);
        startPomodoroButton.textContent = 'Pause';

        pomodoroInterval = setInterval(() => {
            pomodoroTimeLeft--;
            pomodoroDisplay.textContent = formatTime(pomodoroTimeLeft);

            if (pomodoroTimeLeft <= 0) {
                clearInterval(pomodoroInterval);
                pomodoroInterval = null;
                isWorkTime = !isWorkTime; // Toggle between work and break
                alert(isWorkTime ? "Time for work!" : "Time for a break!");
                startPomodoroButton.textContent = 'Start';
                startPomodoroTimer(); // Automatically start the next phase
            }
        }, 1000);
    } else {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        startPomodoroButton.textContent = 'Start';
    }
}

function resetPomodoroTimer() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    isWorkTime = true;
    pomodoroTimeLeft = WORK_TIME;
    pomodoroDisplay.textContent = formatTime(pomodoroTimeLeft);
    startPomodoroButton.textContent = 'Start';
}

startPomodoroButton.addEventListener('click', startPomodoroTimer);
resetPomodoroButton.addEventListener('click', resetPomodoroTimer);

// Excuse Tracker Logic
addExcuseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const excuseText = excuseTextarea.value;
    const assignedTo = excuseAssigneeSelect.value;

    try {
        await addDoc(collection(db, 'excuses'), {
            excuseText,
            assignedTo,
            createdDate: FieldValue.serverTimestamp(),
            isValid: null // null for pending, true for valid, false for invalid
        });
        excuseTextarea.value = ''; // Clear the textarea
        alert("Excuse logged successfully!");
    } catch (error) {
        console.error("Error logging excuse:", error);
        alert("Error logging excuse. Check console for details.");
    }
});

function loadExcuses() {
    const excusesCollectionRef = collection(db, 'excuses');
    const q = query(excusesCollectionRef, orderBy('createdDate', 'desc'));

    onSnapshot(q, (snapshot) => {
        excusesList.innerHTML = ''; // Clear existing excuses
        snapshot.forEach(documentSnapshot => {
            const excuse = { id: documentSnapshot.id, ...documentSnapshot.data() };
            const excuseCard = createExcuseCard(excuse);
            excusesList.appendChild(excuseCard);
        });
    });
}

function createExcuseCard(excuse) {
    const excuseCard = document.createElement('div');
    excuseCard.classList.add('excuse-card');
    excuseCard.dataset.id = excuse.id;

    let statusClass = '';
    let statusText = 'Pending';
    if (excuse.isValid === true) {
        statusClass = 'valid';
        statusText = 'Valid';
    } else if (excuse.isValid === false) {
        statusClass = 'invalid';
        statusText = 'Invalid';
    }

    let userColorClass = '';
    if (excuse.assignedTo === 'Real Estate Agent') {
        userColorClass = 'real-estate-agent';
    } else if (excuse.assignedTo === 'App Developer') {
        userColorClass = 'app-developer';
    }

    const excuseDate = excuse.createdDate ? excuse.createdDate.toDate().toLocaleDateString() : 'N/A';

    excuseCard.innerHTML = `
        <p class="excuse-text">${excuse.excuseText}</p>
        <p class="assigned-to ${userColorClass}">Logged by: ${excuse.assignedTo}</p>
        <p class="excuse-date">Date: ${excuseDate}</p>
        <div class="excuse-status ${statusClass}">Status: ${statusText}</div>
        <div class="excuse-actions">
            <button class="mark-valid" data-id="${excuse.id}">Mark Valid</button>
            <button class="mark-invalid" data-id="${excuse.id}">Mark Invalid</button>
        </div>
    `;

    excuseCard.querySelector('.mark-valid').addEventListener('click', () => updateExcuseStatus(excuse.id, true));
    excuseCard.querySelector('.mark-invalid').addEventListener('click', () => updateExcuseStatus(excuse.id, false));

    return excuseCard;
}

async function updateExcuseStatus(excuseId, isValid) {
    try {
        const excuseRef = doc(db, 'excuses', excuseId);
        await updateDoc(excuseRef, { isValid: isValid });
        alert("Excuse status updated!");
    } catch (error) {
        console.error("Error updating excuse status:", error);
        alert("Error updating excuse status. Check console for details.");
    }
}

// Progress Meter
function updateProgressMeter() {
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'done').length;

    let percentage = 0;
    if (totalTasks > 0) {
        percentage = (completedTasks / totalTasks) * 100;
    }

    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${Math.round(percentage)}%`;
}

// Daily Reset Button
dailyResetButton.addEventListener('click', async () => {
    if (confirm("Are you sure you want to reset for the day? Completed tasks will be archived.")) {
        const batch = writeBatch(db);
        const completedTasks = allTasks.filter(task => task.status === 'done');

        if (completedTasks.length === 0) {
            alert("No tasks to archive.");
            return;
        }

        // Archive completed tasks to a 'daily_archive' collection
        const today = Timestamp.fromDate(new Date());
        completedTasks.forEach(task => {
            const archivedTaskRef = doc(collection(db, 'daily_archive')); // Auto-generate new ID
            batch.set(archivedTaskRef, { ...task, archivedDate: today });
            const taskRef = doc(db, 'tasks', task.id);
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
});

// Export Today's Accomplishments
exportButton.addEventListener('click', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const completedToday = allTasks.filter(task => {
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

    // You can copy to clipboard or offer a download
    navigator.clipboard.writeText(summary).then(() => {
        alert("Today's accomplishments copied to clipboard!");
    }).catch(err => {
        console.error('Could not copy text: ', err);
        alert("Failed to copy to clipboard. Please check console.");
    });

    console.log(summary); // For debugging
});

// Sprint Velocity Chart
async function loadSprintVelocity() {
    const q = query(collection(db, 'daily_archive'), orderBy('archivedDate', 'asc'));
    const snapshot = await getDocs(q); // Use getDocs for a one-time fetch

    const dailyCompletedTasks = {};

    snapshot.forEach(doc => {
        const task = doc.data();
        const date = task.archivedDate.toDate().toLocaleDateString();
        if (!dailyCompletedTasks[date]) {
            dailyCompletedTasks[date] = 0;
        }
        dailyCompletedTasks[date]++;
    });

    let velocitySummary = '<h3>Sprint Velocity (Tasks Completed Per Day)</h3>';
    for (const date in dailyCompletedTasks) {
        velocitySummary += `<p>${date}: ${dailyCompletedTasks[date]} tasks</p>`;
    }

    if (Object.keys(dailyCompletedTasks).length === 0) {
        velocitySummary += '<p>No archived tasks yet to calculate velocity.</p>';
    }

    sprintVelocityChart.innerHTML = velocitySummary;
}

// For development purposes, create a test project in Firebase and use its config.
// Remember to secure your Firestore rules appropriately. Example basic Firestore rules for 'tasks' and 'daily_archive':
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    match /daily_archive/{archiveId} {
      allow read, write: if request.auth != null;
    }
  }
}
*/
