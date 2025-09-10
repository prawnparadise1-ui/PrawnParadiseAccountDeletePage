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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Please sign in first.");
    window.location.href = "login.html"; // ✅ relative path
  }
});

document.getElementById('deleteBtn').addEventListener('click', async () => {
  const user = auth.currentUser;

  if (!user) {
    alert("No user is currently signed in...");
    return;
  }

  const uid = user.uid;

  const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });

  const phoneProvider = new PhoneAuthProvider(auth);

  phoneProvider.verifyPhoneNumber(user.phoneNumber, recaptcha)
    .then((verificationId) => {
      const smsCode = prompt("Enter the SMS code you received:");
      const credential = PhoneAuthProvider.credential(verificationId, smsCode);
      return reauthenticateWithCredential(user, credential);
    })
    .then(() => remove(ref(db, 'users/' + uid)))
    .then(() => deleteUser(auth.currentUser))
    .then(() => {
      alert("Account and data deleted successfully.");
      window.location.href = "/"; // Redirect after deletion
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred: " + error.message);
    });
});
