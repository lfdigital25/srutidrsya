// Firebase configuration removed - project migrated to Vercel
// This file is kept for compatibility with existing imports

export const requestForToken = async () => {
  console.log('FCM notifications not available - using local storage');
  return null;
};

export const onMessageListener = (callback: (payload: any) => void) => {
  return () => {};
};

export const signInWithGoogle = async () => {
  console.log('Google Sign-In not available');
  throw new Error('Google Sign-In not configured');
};

export const logOut = async () => {
  console.log('Sign out not available');
};

const app = null;
const analytics = null;
const messaging = null;
const auth = null;
const db = null;

export { app, analytics, messaging, auth, db };

