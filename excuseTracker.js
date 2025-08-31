// excuseTracker.js - Handles excuse logging and validation

import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export class ExcuseTracker {
    constructor(db) {
        this.db = db;
        this.addExcuseForm = document.getElementById('add-excuse-form');
        this.excuseTextarea = document.getElementById('excuse-text');
        this.excuseAssigneeSelect = document.getElementById('excuse-assignee');
        this.excusesList = document.getElementById('excuses-list');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.addExcuseForm?.addEventListener('submit', (e) => this.handleAddExcuse(e));
    }

    async handleAddExcuse(e) {
        e.preventDefault();
        const excuseText = this.excuseTextarea.value;
        const assignedTo = this.excuseAssigneeSelect.value;

        try {
            await addDoc(collection(this.db, 'excuses'), {
                excuseText,
                assignedTo,
                createdDate: serverTimestamp(),
                isValid: null // null for pending, true for valid, false for invalid
            });
            this.excuseTextarea.value = '';
            alert("Excuse logged successfully!");
        } catch (error) {
            console.error("Error logging excuse:", error);
            alert("Error logging excuse. Check console for details.");
        }
    }

    loadExcuses() {
        const excusesCollectionRef = collection(this.db, 'excuses');
        const q = query(excusesCollectionRef, orderBy('createdDate', 'desc'));

        onSnapshot(q, (snapshot) => {
            this.excusesList.innerHTML = '';
            snapshot.forEach(documentSnapshot => {
                const excuse = { id: documentSnapshot.id, ...documentSnapshot.data() };
                const excuseCard = this.createExcuseCard(excuse);
                this.excusesList.appendChild(excuseCard);
            });
        });
    }

    createExcuseCard(excuse) {
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

        excuseCard.querySelector('.mark-valid').addEventListener('click', () => this.updateExcuseStatus(excuse.id, true));
        excuseCard.querySelector('.mark-invalid').addEventListener('click', () => this.updateExcuseStatus(excuse.id, false));

        return excuseCard;
    }

    async updateExcuseStatus(excuseId, isValid) {
        try {
            const excuseRef = doc(this.db, 'excuses', excuseId);
            await updateDoc(excuseRef, { isValid: isValid });
            alert("Excuse status updated!");
        } catch (error) {
            console.error("Error updating excuse status:", error);
            alert("Error updating excuse status. Check console for details.");
        }
    }
}