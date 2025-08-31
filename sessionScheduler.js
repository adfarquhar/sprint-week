// sessionScheduler.js - Handles sister support session scheduling

import { 
    collection, 
    doc, 
    setDoc,
    deleteDoc,
    query, 
    where,
    onSnapshot, 
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export class SessionScheduler {
    constructor(db, getCurrentUser) {
        this.db = db;
        this.getCurrentUser = getCurrentUser;
        this.timeSlotsContainer = document.getElementById('time-slots-container');
        
        this.generateTimeSlots();
    }

    // Generate time slots for the day (10 AM to 5 PM, 30-minute blocks)
    generateTimeSlots() {
        if (!this.timeSlotsContainer) return;
        
        this.timeSlotsContainer.innerHTML = '';
        
        const startHour = 10; // 10 AM
        const endHour = 17;   // 5 PM
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
                const timeSlot = document.createElement('div');
                timeSlot.classList.add('time-slot', 'available');
                
                // Format time display
                const displayHour = hour > 12 ? hour - 12 : hour;
                const amPm = hour >= 12 ? 'PM' : 'AM';
                const displayMinutes = minutes === 0 ? '00' : '30';
                const timeText = `${displayHour}:${displayMinutes} ${amPm}`;
                
                timeSlot.textContent = timeText;
                timeSlot.dataset.time = `${hour}:${displayMinutes}`;
                timeSlot.dataset.slotId = `${this.getDateString()}-${hour}-${minutes}`;
                
                // Add click event listener
                timeSlot.addEventListener('click', () => this.handleSlotClick(timeSlot));
                
                this.timeSlotsContainer.appendChild(timeSlot);
            }
        }
    }

    getDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadSessions() {
        const todayString = this.getDateString();
        const sessionsRef = collection(this.db, 'sessions');
        const q = query(sessionsRef, where('date', '==', todayString));
        
        onSnapshot(q, (snapshot) => {
            // Reset all slots to available first
            document.querySelectorAll('.time-slot').forEach(slot => {
                slot.classList.remove('claimed', 'mine');
                slot.classList.add('available');
                const timeText = slot.textContent.split('\n')[0]; // Remove any additional text
                slot.textContent = timeText;
            });
            
            // Update slots based on claims
            snapshot.forEach(docSnapshot => {
                const session = docSnapshot.data();
                const slotElement = document.querySelector(`[data-slot-id="${session.slotId}"]`);
                
                if (slotElement) {
                    const { currentUser } = this.getCurrentUser();
                    slotElement.classList.remove('available');
                    
                    if (session.claimedBy === currentUser?.email) {
                        slotElement.classList.add('mine');
                        slotElement.innerHTML = `${slotElement.textContent}<br><small>Your Session</small>`;
                    } else {
                        slotElement.classList.add('claimed');
                        const role = session.claimedByRole || 'Sister';
                        slotElement.innerHTML = `${slotElement.textContent}<br><small>${role}</small>`;
                    }
                }
            });
        });
    }

    async handleSlotClick(slotElement) {
        const { currentUser, currentUserRole } = this.getCurrentUser();
        if (!currentUser) return;
        
        const slotId = slotElement.dataset.slotId;
        const sessionRef = doc(this.db, 'sessions', slotId);
        
        if (slotElement.classList.contains('available')) {
            // Claim the slot
            try {
                await setDoc(sessionRef, {
                    slotId: slotId,
                    date: this.getDateString(),
                    time: slotElement.dataset.time,
                    claimedBy: currentUser.email,
                    claimedByRole: currentUserRole,
                    claimedAt: serverTimestamp()
                });
                alert(`Support session claimed for ${slotElement.textContent}`);
            } catch (error) {
                console.error("Error claiming session:", error);
                alert("Failed to claim session. Please try again.");
            }
        } else if (slotElement.classList.contains('mine')) {
            // Release the slot
            if (confirm("Do you want to release this support session?")) {
                try {
                    await deleteDoc(sessionRef);
                    alert("Support session released");
                } catch (error) {
                    console.error("Error releasing session:", error);
                    alert("Failed to release session. Please try again.");
                }
            }
        } else if (slotElement.classList.contains('claimed')) {
            alert("This session is already claimed by your sister");
        }
    }
}