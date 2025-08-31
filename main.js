// main.js - Main application entry point
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Import our modules
import { TaskManager } from './taskManager.js';

// Firebase configuration
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

// Initialize managers
const taskManager = new TaskManager(db);

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const userProfile = document.getElementById('user-profile');

// Current user state
let currentUser = null;
let currentUserRole = null;

// Authentication State Listener
onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;
        currentUserRole = user.email.includes('dev') ? 'App Developer' : 'Real Estate Agent';
        
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        userProfile.textContent = `Welcome, ${user.email}`;
        
        // Load all features
        taskManager.loadTasks();
        
        // TODO: Load other features as we modularize them
        // excuseManager.loadExcuses();
        // sessionScheduler.loadSessions();
        // pomodoroTimer.initialize();
        // standupTimer.initialize();
        // velocityChart.load();
        
    } else {
        currentUser = null;
        currentUserRole = null;
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

// Login
loginForm?.addEventListener('submit', async (e) => {
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
logoutButton?.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert(error.message);
    }
});

// Export for use by other modules if needed
export { currentUser, currentUserRole, db, auth };