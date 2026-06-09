// Import the core Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

// Import the specific services we are using
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

// Your specific web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDAH4_75qX-4YSUP9pFnEhekTpCFxzgDnY",
    authDomain: "shift-handover-df4d8.firebaseapp.com",
    projectId: "shift-handover-df4d8",
    storageBucket: "shift-handover-df4d8.firebasestorage.app",
    messagingSenderId: "680824877405",
    appId: "1:680824877405:web:bd0ebe102ce147080938b4"
};

// Initialize Firebase and the services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
let currentUser = null;

// --- Login Logic ---
document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('usernameInput').value.trim();
    const pin = document.getElementById('pinInput').value;
    
    // Append the dummy domain to bypass Firebase's email requirement
    const dummyEmail = `${username}@factory.local`;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, dummyEmail, pin);
        currentUser = userCredential.user;
        
        // Hide login, show dashboard
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    } catch (error) {
        alert("Invalid Username or PIN");
        console.error("Login Error:", error);
    }
});

// --- Submit Logic ---
document.getElementById('submitBtn').addEventListener('click', async () => {
    const shift = document.getElementById('shiftSelect').value;
    const area = document.getElementById('areaSelect').value;
    const issue = document.getElementById('issueInput').value.trim();
    const photoFile = document.getElementById('photoInput').files[0];
    const username = document.getElementById('usernameInput').value.trim();

    // Basic validation
    if (!issue) {
        alert("Please describe the issue before submitting.");
        return;
    }

    // Change button text and disable it to prevent double submissions
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "Uploading Evidence & Report...";
    submitBtn.disabled = true;

    let photoUrl = "";

    try {
        // 1. Upload Photo to Firebase Storage if one was attached
        if (photoFile) {
            // Create a unique filename using the current timestamp and original name
            const storageRef = ref(storage, `evidence/${Date.now()}_${photoFile.name}`);
            const snapshot = await uploadBytes(storageRef, photoFile);
            photoUrl = await getDownloadURL(snapshot.ref);
        }

        // 2. Save the Shift Report to Firestore Database
        await addDoc(collection(db, "shift_reports"), {
            reportedBy: username,
            shift: shift,
            area: area,
            issueDetails: issue,
            photoUrl: photoUrl,
            status: "Open", // Default status for new issues
            timestamp: serverTimestamp() // Uses Firebase server time for accurate sorting
        });

        alert("Shift report submitted successfully!");
        
        // Reset the form fields for the next report
        document.getElementById('issueInput').value = "";
        document.getElementById('photoInput').value = "";
        
        // Reset the button
        submitBtn.innerText = "Submit Report";
        submitBtn.disabled = false;

    } catch (error) {
        console.error("Error submitting report: ", error);
        alert("Failed to submit the report. Please check your connection and try again.");
        
        // Reset the button in case of failure so they can try again
        submitBtn.innerText = "Submit Report";
        submitBtn.disabled = false;
    }
});