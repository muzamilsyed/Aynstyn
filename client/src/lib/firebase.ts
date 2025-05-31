import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, TwitterAuthProvider, OAuthProvider } from "firebase/auth";

// Firebase configuration with the values you provided
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "aynstyn-30772.firebaseapp.com",
  projectId: "aynstyn-30772",
  storageBucket: "aynstyn-30772.appspot.com",
  messagingSenderId: "744630033046",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Authentication providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const twitterProvider = new TwitterAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export { auth };
export default app;