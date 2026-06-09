// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Your Firebase configuration (Same as app.js)
const firebaseConfig = {
    apiKey: "AIzaSyDAH4_75qX-4YSUP9pFnEhekTpCFxzgDnY",
    authDomain: "shift-handover-df4d8.firebaseapp.com",
    projectId: "shift-handover-df4d8",
    storageBucket: "shift-handover-df4d8.firebasestorage.app",
    messagingSenderId: "680824877405",
    appId: "1:680824877405:web:bd0ebe102ce147080938b4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global array to store fetched issues so we can filter them locally without re-downloading
let allIssues = [];

// DOM Elements
const issuesContainer = document.getElementById('issuesContainer');
const dateFilter = document.getElementById('dateFilter');
const clearFilterBtn = document.getElementById('clearFilterBtn');

// Function to fetch all issues from Firestore
async function fetchIssues() {
    try {
        // Query the 'shift_reports' collection, order by newest first
        const q = query(collection(db, "shift_reports"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        allIssues = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allIssues.push({ id: doc.id, ...data });
        });

        renderIssues(allIssues); // Render all issues initially

    } catch (error) {
        console.error("Error fetching documents: ", error);
        issuesContainer.innerHTML = `<p class="no-data" style="color: red;">Error loading reports. Check console.</p>`;
    }
}

// Function to draw the HTML cards to the screen
function renderIssues(issuesToDisplay) {
    issuesContainer.innerHTML = ""; // Clear the container

    if (issuesToDisplay.length === 0) {
        issuesContainer.innerHTML = `<p class="no-data">No issues found for this selection.</p>`;
        return;
    }

    issuesToDisplay.forEach((data) => {
        // Format the Firebase timestamp into a readable date and time
        let dateString = "Time Unknown";
        let dateOnly = "Unknown Date";
        
        if (data.timestamp) {
            const dateObj = data.timestamp.toDate();
            dateString = dateObj.toLocaleString(); // e.g., "6/9/2026, 10:30:00 PM"
            // Get YYYY-MM-DD for exact string matching with the date input filter
            dateOnly = dateObj.toISOString().split('T')[0]; 
        }

        // Attach the pure date string to the data object for easier filtering later
        data.filterDate = dateOnly;

        // Only create an image tag if a photo URL exists
        const photoHtml = data.photoUrl 
            ? `<img src="${data.photoUrl}" class="evidence-img" alt="Evidence Photo">` 
            : ``;

        // Build the HTML for the card
        const cardHtml = `
            <div class="issue-card">
                <div class="issue-header">
                    <h3>${data.area}</h3>
                    <span class="badge">${data.shift} Shift</span>
                </div>
                <p><strong>Reported By:</strong> ${data.reportedBy}</p>
                <p><strong>Logged At:</strong> ${dateString}</p>
                <p style="white-space: pre-wrap;"><strong>Details:</strong><br>${data.issueDetails}</p>
                ${photoHtml}
            </div>
        `;
        
        issuesContainer.innerHTML += cardHtml;
    });
}

// Filter logic: When the user picks a date, update the screen
dateFilter.addEventListener('change', (e) => {
    const selectedDate = e.target.value; // Format will be YYYY-MM-DD
    
    if (!selectedDate) {
        renderIssues(allIssues);
        return;
    }

    const filteredIssues = allIssues.filter(issue => issue.filterDate === selectedDate);
    renderIssues(filteredIssues);
});

// Clear filter logic
clearFilterBtn.addEventListener('click', () => {
    dateFilter.value = "";
    renderIssues(allIssues);
});

// Run the fetch function as soon as the page loads
fetchIssues();