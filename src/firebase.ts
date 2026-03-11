import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAkMfQEtumDB8ih-bcOmU0MOWEDRXZBRvc",
  authDomain: "srutidrsya.firebaseapp.com",
  projectId: "srutidrsya",
  storageBucket: "srutidrsya.firebasestorage.app",
  messagingSenderId: "645482388272",
  appId: "1:645482388272:web:5bed824d8a89f0d0d506f5",
  measurementId: "G-27NRYLWSXQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export const requestForToken = async () => {
  if (!messaging) return null;
  try {
    // Return null immediately if no VAPID key is configured to prevent InvalidAccessError
    // Uncomment the code below once you have a valid key from Firebase Console
    return null;
    /*
    const currentToken = await getToken(messaging, {
      // The VAPID key was invalid, causing the 'InvalidAccessError'.
      // To fix push notifications, generate a new key in your Firebase Console:
      // Project Settings > Cloud Messaging > Web configuration > Generate key pair
      // vapidKey: 'FNsiYQ8TP_M_EYAQBBbvmTdCchAIgDV71W8KUmLZX-8'
    });
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
    */
  } catch (err: any) {
    if (err?.code === 'messaging/permission-blocked') {
      console.warn('Notification permission was blocked by the user or browser.');
    } else {
      console.error('An error occurred while retrieving token. ', err);
    }
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
    // User will be handled by onAuthStateChanged after redirect
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export { app, analytics, messaging, auth, db };
