import { auth } from "./Firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
} from "firebase/auth";


export const doCreateUserWithEmailAndPassword = async (email, password) => {
  const authInstance = getAuth(); // use unique instance 

  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;

   
    await sendEmailVerification(user, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true, 
    });

    console.log("Verification email sent to:", user.email);
    return userCredential;
  } catch (err) {
    handleAuthError(err);
    throw err;
  }
};




export const doSignInWithEmailAndPassword = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    handleAuthError(err);
    throw err;
  }
};


export const doSignInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    handleAuthError(err);
    throw err;
  }
};


export const doSignOut = async () => {
  try {
    return await auth.signOut();
  } catch (err) {
    console.error("Error signing out:", err);
    throw err;
  }
};


export const doPasswordReset = async (email) => {
  try {
    return await sendPasswordResetEmail(auth, email);
  } catch (err) {
    handleAuthError(err);
    throw err;
  }
};


export const doPasswordChange = async (password) => {
  try {
    return await updatePassword(auth.currentUser, password);
  } catch (err) {
    handleAuthError(err);
    throw err;
  }
};


export const doSendEmailVerification = async () => {
  try {
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      throw new Error("No authenticated user found to send verification email.");
    }

    await sendEmailVerification(user, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    });

    console.log("Verification email re-sent to:", user.email);
  } catch (err) {
    handleAuthError(err);
    throw err;
  }
};


const handleAuthError = (err) => {
  if (!err || !err.code) {
    console.error("Unknown Firebase error:", err);
    return;
  }

  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      console.error("Invalid email or password.");
      break;
    case "auth/user-not-found":
      console.error("No user found with this email.");
      break;
    case "auth/email-already-in-use":
      console.error("Email already in use.");
      break;
    case "auth/weak-password":
      console.error("Password should be at least 6 characters.");
      break;
    case "auth/too-many-requests":
      console.error(
        "Too many attempts. Please wait a few minutes before trying again."
      );
      break;
    case "auth/network-request-failed":
      console.error("Network error. Please check your connection.");
      break;
    default:
      console.error("Firebase Auth Error:", err.code, err.message);
  }
};
