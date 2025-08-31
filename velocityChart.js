// velocityChart.js - Handles sprint velocity tracking and visualization

import { 
    collection, 
    query, 
    orderBy, 
    getDocs
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export class VelocityChart {
    constructor(db) {
        this.db = db;
        this.chartContainer = document.getElementById('sprint-velocity-chart');
    }

    async load() {
        const q = query(collection(this.db, 'daily_archive'), orderBy('archivedDate', 'asc'));
        const snapshot = await getDocs(q);

        const dailyCompletedTasks = {};

        snapshot.forEach(doc => {
            const task = doc.data();
            const date = task.archivedDate.toDate().toLocaleDateString();
            if (!dailyCompletedTasks[date]) {
                dailyCompletedTasks[date] = 0;
            }
            dailyCompletedTasks[date]++;
        });

        this.render(dailyCompletedTasks);
    }

    render(dailyCompletedTasks) {
        let velocitySummary = '<h3>Sprint Velocity (Tasks Completed Per Day)</h3>';
        
        if (Object.keys(dailyCompletedTasks).length === 0) {
            velocitySummary += '<p>No archived tasks yet to calculate velocity.</p>';
        } else {
            for (const date in dailyCompletedTasks) {
                velocitySummary += `<p>${date}: ${dailyCompletedTasks[date]} tasks</p>`;
            }
            
            // Calculate and show average
            const totalTasks = Object.values(dailyCompletedTasks).reduce((a, b) => a + b, 0);
            const avgTasks = (totalTasks / Object.keys(dailyCompletedTasks).length).toFixed(1);
            velocitySummary += `<p><strong>Average: ${avgTasks} tasks/day</strong></p>`;
        }

        if (this.chartContainer) {
            this.chartContainer.innerHTML = velocitySummary;
        }
    }

    // Optional: Add a visual chart later using a library like Chart.js
    renderVisualChart(dailyCompletedTasks) {
        // Future enhancement: Create an actual chart
        // This would require adding Chart.js to your project
        console.log('Visual chart data:', dailyCompletedTasks);
    }
}