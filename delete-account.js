const user = auth.currentUser;

if (!user) {
  alert("No user is currently signed in...");
  return;
}

const uid = user.uid;

// Clear any existing recaptcha
if (window.recaptchaVerifier) {
  window.recaptchaVerifier.clear();
}

const recaptcha = new RecaptchaVerifier('recaptcha-container', {
  size: 'invisible',
}, auth);

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
    window.location.href = "/";
  })
  .catch((error) => {
    console.error("Error:", error);
    alert("An error occurred: " + error.message);
  });
