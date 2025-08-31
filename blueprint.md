# Sprint Task Tracker Blueprint

## Overview

This document outlines the plan for creating a simple Sprint Task Tracker web app. The app is designed for two users, a "Real Estate Agent" and an "App Developer," to manage their shared tasks and track progress.

## Core Features

*   **User Profiles:** "Real Estate Agent" and "App Developer".
*   **Shared Task Board:** Columns for "To Do Today", "In Progress", "Blocked", and "Done".
*   **Drag and Drop:** Move tasks between columns. **(Implemented)**
*   **Task Details:** Title, time estimate (hours), assigned person, priority (high/medium/low). **(Implemented)**
*   **Daily Standup Timer:** 15-minute countdown with prompts. **(Implemented)**
*   **Progress Meter:** Percentage of completed vs. planned tasks. **(Implemented)**
*   **Authentication:** Email/password login with data persistence in Firestore. **(Implemented)**
*   **Pomodoro Timer:** A simple Pomodoro timer (25 min work, 5 min break) in the header. **(Implemented)**
*   **Excuse Tracker:** A section to log excuses and mark them as 'valid' or 'invalid'. **(Implemented)**
*   **Sister Support Session Scheduler:** 30-minute blocks that users can claim to help each other.

## Simple Features

*   **Add Task:** Modal form to add new tasks. **(Implemented)**
*   **Mark Complete:** Automatically move tasks to the "Done" column. **(Implemented via drag and drop)**
*   **Daily Reset:** Archive completed tasks. **(Implemented - archives to `daily_archive` collection)**
*   **Sprint Velocity Chart:** Simple chart showing tasks completed per day. **(Implemented - textual summary from `daily_archive`)**
*   **Export:** Export today's accomplishments as a text summary. **(Implemented)**

## Visual Design

*   **Interface:** Clean, minimal, with good contrast. **(Implemented)**
*   **Responsive:** Mobile-friendly design. **(Implemented)**
*   **Color Coding:**
    *   Real Estate Agent: Blue
    *   App Developer: Green
*   **Usability:** Large, clickable elements. **(Implemented)**

## Development Plan

1.  **HTML Structure (`index.html`):**
    *   Create the main layout with containers for the login screen, task board, timer, progress meter, and excuse tracker. **(Done)**
    *   Link to `style.css` and `main.js`. **(Done)**
    *   Include Firebase SDKs from the CDN. **(Done - now using modular SDKs)**

2.  **CSS Styling (`style.css`):**
    *   Apply a clean and modern design. **(Done)**
    *   Implement a mobile-responsive layout. **(Done)**
    *   Define the color-coding scheme. **(Done)**
    *   Style the Pomodoro timer and Excuse Tracker. **(Done)**

3.  **JavaScript Logic (`main.js`):**
    *   **Authentication:**
        *   Implement Firebase email/password authentication. **(Done - now using modular SDKs)**
    *   **Task Management:**
        *   Implement CRUD operations for tasks. **(Create and Update implemented, Delete for daily reset - now using modular SDKs)**
        *   Enable drag-and-drop functionality. **(Done)**
    *   **Timer and Progress Meter:**
        *   Create the countdown timer and progress meter components. **(Done)**
    *   **Pomodoro Timer:**
        *   Implement the logic for the Pomodoro timer. **(Done)**
    *   **Excuse Tracker:**
        *   Implement logic to add, load, and update excuses in Firestore. **(Done)**
    *   **Data Handling:**
        *   Interact with Firestore for data storage. **(Done - now using modular SDKs)**
        *   Implement the daily reset and export features. **(Done)**
        *   Implement basic sprint velocity visualization from `daily_archive`. **(Done - textual summary)**

4.  **Firebase Integration:**
    *   Set up a new Firebase project. **(Requires user action and updating `firebaseConfig` in `main.js`)**
    *   Configure Firestore and Firebase Authentication. **(Requires user action and updating `firebaseConfig` in `main.js`)**
    *   Add Firebase configuration to `main.js`. **(Done)**
    *   Secure Firestore with appropriate rules for the `excuses` collection. **(Requires user action)**

5.  **Sister Support Session Scheduler (`index.html`, `style.css`, `main.js`):**
    *   Add a new section to `index.html` to house the scheduler.
    *   Add styling to `style.css` for the scheduler, including states for available, claimed, and the user's own claimed slots.
    *   In `main.js`:
        *   Dynamically generate time slots for the day (e.g., 9:00 AM to 5:00 PM).
        *   Create a new Firestore collection `sessions` to store the schedule.
        *   Implement logic to load the session schedule from Firestore.
        *   Add event listeners to the time slots to allow users to claim them.
        *   When a user claims a slot, update the corresponding document in the `sessions` collection.
        *   Ensure the schedule updates in real-time using Firestore snapshots.
    *   Update Firestore rules to allow authenticated users to read and write to the `sessions` collection.

## Current Status

*   The `blueprint.md` file has been updated to include the new "Sister Support Session Scheduler" feature.
