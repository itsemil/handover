import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// 1. Firebase Config (Text Database Only)
const firebaseConfig = {
    apiKey: "AIzaSyDAH4_75qX-4YSUP9pFnEhekTpCFxzgDnY",
    authDomain: "shift-handover-df4d8.firebaseapp.com",
    projectId: "shift-handover-df4d8",
    storageBucket: "shift-handover-df4d8.firebasestorage.app",
    messagingSenderId: "680824877405",
    appId: "1:680824877405:web:bd0ebe102ce147080938b4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Cloudinary Credentials (REPLACE THESE WITH YOUR DETAILS)
const CLOUDINARY_CLOUD_NAME = "ml_default"; 
const CLOUDINARY_UPLOAD_PRESET = "YOUR_UNSIGNED_UPLOAD_PRESET_NAME";

// Simple local operator credentials
const users = {
    "jsmith": "1234",
    "mbrookes": "5678",
    "asupervisor": "0000" 
};

let currentLoggedInUser = "";

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const usernameInput = document.getElementById('usernameInput');
const pinInput = document.getElementById('pinInput');
const loginBtn = document.getElementById('loginBtn');
const submitBtn = document.getElementById('submitBtn');

// Login Event
loginBtn.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pin = pinInput.value.trim();

    if (users[user] && users[user] === pin) {
        currentLoggedInUser = user;
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    } else {
        alert("Invalid Username or PIN!");
    }
});

// Report Submission Event
submitBtn.addEventListener('click', async () => {
    const shift = document.getElementById('shiftSelect').value;
    const area = document.getElementById('areaSelect').value;
    const issueDetails = document.getElementById('issueInput').value.trim();
    const photoFile = document.getElementById('photoInput').files[0];

    if (!area || !issueDetails) {
        alert("Please select an Area and provide Issue Details.");
        return;
    }

    // Disable button to prevent double submissions
    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";

    let finalPhotoUrl = ""; // Default empty string if no photo is uploaded

    try {
        // If the operator attached a photo, upload it to Cloudinary first
        if (photoFile) {
            const formData = new FormData();
            formData.append('file', photoFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            // Fetch request straight to Cloudinary's secure upload API
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to upload image to Cloudinary.");
            }

            const cloudinaryData = await response.json();
            finalPhotoUrl = cloudinaryData.secure_url; // This is the live image URL link
        }

        // Save everything into Firestore Database
        await addDoc(collection(db, "shift_reports"), {
            shift: shift,
            area: area,
            issueDetails: issueDetails,
            photoUrl: finalPhotoUrl, // Storing the Cloudinary text link here
            reportedBy: currentLoggedInUser,
            timestamp: serverTimestamp()
        });

        alert("Report successfully submitted!");
        
        // Reset the form fields
        document.getElementById('issueInput').value = "";
        document.getElementById('photoInput').value = "";

    } catch (error) {
        console.error("Submission failed: ", error);
        alert("Error submitting report. Please check your connections.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Report";
    }
});