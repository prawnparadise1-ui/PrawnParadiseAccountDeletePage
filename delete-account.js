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

const firebaseConfig = {
  apiKey: "AIzaSyBNyDnZd2bEanSFPGu7xMgEq04g_mLXRiU",
  authDomain: "testappd-bfd14.firebaseapp.com",
  databaseURL: "https://testappd-bfd14.firebaseio.com",
  projectId: "testappd-bfd14",
  storageBucket: "testappd-bfd14.firebasestorage.app",
  messagingSenderId: "1065516210854",
  appId: "1:1065516210854:web:e8c5c22a075728927d7267"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Redirect to login if not signed in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Please sign in first...");
    window.location.href = "login.html";
  }
});

document.getElementById('deleteBtn').addEventListener('click', async () => {
  const user = auth.currentUser;

  if (!user) {
    alert("No user is currently signed in...");
    return;
  }

  if (!user.phoneNumber) {
    alert("No phone number found for current user. Cannot reauthenticate.");
    return;
  }

  const uid = user.uid;

  // Clear any existing recaptcha instances
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }

  // Initialize invisible reCAPTCHA
  const recaptcha = new RecaptchaVerifier('recaptcha-container', {
    size: 'invisible',
  }, auth);

  try {
    // Send verification code to user's phone
    const verificationId = await new PhoneAuthProvider(auth).verifyPhoneNumber(user.phoneNumber, recaptcha);

    // Ask user to enter the SMS code (simple prompt, replace with UI if needed)
    const smsCode = prompt("Enter the SMS code you received to confirm deletion:");

    if (!smsCode) {
      alert("Deletion cancelled. No code entered.");
      return;
    }

    // Build credential from verification ID and SMS code
    const credential = PhoneAuthProvider.credential(verificationId, smsCode);

    // Reauthenticate user with credential
    await reauthenticateWithCredential(user, credential);

    // Remove user data from Realtime Database
    await remove(ref(db, 'users/' + uid));

    // Delete user authentication account
    await deleteUser(user);

    alert("Account and data deleted successfully.");
    window.location.href = "/"; // Redirect to homepage or login page after deletion

  } catch (error) {
    console.error("Error during account deletion:", error);
    alert("An error occurred: " + error.message);
  }
});
