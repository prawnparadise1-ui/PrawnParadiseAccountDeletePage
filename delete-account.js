import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  deleteUser,
  onAuthStateChanged,
  PhoneAuthProvider,
  reauthenticateWithCredential,
  RecaptchaVerifier,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNyDnZd2bEanSFPGu7xMgEq04g_mLXRiU",
  authDomain: "testappd-bfd14.firebaseapp.com",
  databaseURL: "https://testappd-bfd14.firebaseio.com",
  projectId: "testappd-bfd14",
  storageBucket: "testappd-bfd14.firebasestorage.app",
  messagingSenderId: "1065516210854",
  appId: "1:1065516210854:web:e8c5c22a075728927d7267"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Ensure a user is signed in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("No user signed in, redirecting to login.");
    alert("Please sign in first...");
    window.location.href = "login.html";
  } else {
    console.log("User is signed in:", user.uid);
  }
});

// Attach event listener to the delete button
const deleteButton = document.getElementById('deleteBtn');

if (deleteButton) {
  deleteButton.addEventListener('click', async () => {
    console.log("Delete Account button clicked.");

    const user = auth.currentUser;

    if (!user) {
      console.error("No user is currently signed in.");
      alert("No user is currently signed in...");
      return;
    }

    console.log("Current user found:", user.uid);

    if (!user.phoneNumber) {
      console.error("No phone number found for the current user.");
      alert("No phone number found for current user. Cannot reauthenticate.");
      return;
    }

    console.log("User's phone number:", user.phoneNumber);

    const uid = user.uid;

    // Ensure the reCAPTCHA container is in the DOM
    if (!document.getElementById('recaptcha-container')) {
      console.error("reCAPTCHA container not found. Please add <div id='recaptcha-container'></div> to your HTML.");
      alert("A configuration error occurred. Please contact support.");
      return;
    }

    // Clear any existing reCAPTCHA instances to avoid errors
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      console.log("Cleared previous reCAPTCHA verifier.");
    }

    console.log("Initializing invisible reCAPTCHA verifier...");
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved, you can proceed with phone verification
          console.log("reCAPTCHA solved successfully.");
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.warn("reCAPTCHA response expired.");
        }
      });
    } catch (error) {
      console.error("Failed to initialize RecaptchaVerifier:", error);
      alert("Failed to initialize reCAPTCHA. Please refresh and try again.");
      return;
    }

    try {
      console.log("Sending verification code to", user.phoneNumber);
      const phoneProvider = new PhoneAuthProvider(auth);

      const verificationId = await phoneProvider.verifyPhoneNumber(
        user.phoneNumber,
        window.recaptchaVerifier
      );

      console.log("Verification code sent. Verification ID:", verificationId);

      const smsCode = prompt("To confirm deletion, please enter the SMS code you received:");

      if (!smsCode) {
        console.log("User cancelled deletion by not entering an SMS code.");
        alert("Deletion cancelled. No code entered.");
        return;
      }

      console.log("User entered SMS code.");

      console.log("Creating phone credential...");
      const credential = PhoneAuthProvider.credential(verificationId, smsCode);

      console.log("Re-authenticating user...");
      await reauthenticateWithCredential(user, credential);
      console.log("User re-authenticated successfully.");

      console.log("Removing user data from Realtime Database for UID:", uid);
      await remove(ref(db, 'users/' + uid));
      console.log("User data removed from database.");

      console.log("Deleting user authentication account...");
      await deleteUser(user);
      console.log("User account deleted successfully.");

      alert("Account and data deleted successfully.");
      window.location.href = "/"; // Redirect after deletion

    } catch (error) {
      console.error("Error during account deletion process:", error);
      alert("An error occurred during account deletion: " + error.message);

      // Also reset the reCAPTCHA on failure
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          grecaptcha.reset(widgetId);
        });
      }
    }
  });
} else {
  console.error("Delete button with ID 'deleteBtn' not found.");
}
