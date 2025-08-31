// timers.js - Handles Pomodoro and Standup timers

export class PomodoroTimer {
    constructor() {
        this.pomodoroDisplay = document.getElementById('pomodoro-display');
        this.startButton = document.getElementById('start-pomodoro');
        this.resetButton = document.getElementById('reset-pomodoro');
        
        this.interval = null;
        this.timeLeft = null;
        this.isWorkTime = true;
        this.WORK_TIME = 25 * 60; // 25 minutes
        this.BREAK_TIME = 5 * 60;  // 5 minutes
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.startButton?.addEventListener('click', () => this.toggle());
        this.resetButton?.addEventListener('click', () => this.reset());
    }

    toggle() {
        if (!this.interval) {
            this.start();
        } else {
            this.pause();
        }
    }

    start() {
        if (this.timeLeft === null) {
            this.timeLeft = this.isWorkTime ? this.WORK_TIME : this.BREAK_TIME;
        }
        
        this.updateDisplay();
        this.startButton.textContent = 'Pause';
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        clearInterval(this.interval);
        this.interval = null;
        this.startButton.textContent = 'Start';
    }

    complete() {
        clearInterval(this.interval);
        this.interval = null;
        this.isWorkTime = !this.isWorkTime;
        alert(this.isWorkTime ? "Time for work!" : "Time for a break!");
        this.startButton.textContent = 'Start';
        this.timeLeft = null;
        this.start(); // Auto-start next phase
    }

    reset() {
        clearInterval(this.interval);
        this.interval = null;
        this.isWorkTime = true;
        this.timeLeft = this.WORK_TIME;
        this.updateDisplay();
        this.startButton.textContent = 'Start';
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.pomodoroDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

export class StandupTimer {
    constructor() {
        this.timerDisplay = document.getElementById('timer');
        this.standupPrompts = document.getElementById('standup-prompts');
        this.timerContainer = document.getElementById('timer-container');
        
        this.interval = null;
        this.STANDUP_TIME = 15 * 60; // 15 minutes
        
        this.createStartButton();
    }

    createStartButton() {
        this.startButton = document.createElement('button');
        this.startButton.textContent = 'Start Standup';
        this.startButton.addEventListener('click', () => this.start());
        this.timerContainer?.prepend(this.startButton);
    }

    start() {
        let timeLeft = this.STANDUP_TIME;
        
        this.timerDisplay.textContent = this.formatTime(timeLeft);
        this.standupPrompts.innerHTML = `
            <p>Real Estate Agent: What did you do yesterday? What will you do today? Any blockers?</p>
            <p>App Developer: What did you do yesterday? What will you do today? Any blockers?</p>
        `;
        this.startButton.disabled = true;

        this.interval = setInterval(() => {
            timeLeft--;
            this.timerDisplay.textContent = this.formatTime(timeLeft);

            if (timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    }

    complete() {
        clearInterval(this.interval);
        this.timerDisplay.textContent = "Time's Up!";
        this.standupPrompts.innerHTML = "<p>Standup finished!</p>";
        this.startButton.disabled = false;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}