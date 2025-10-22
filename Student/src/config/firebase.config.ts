// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQ-PIzODrAIiSZcjyZIV68vqzB0Ew8SAc",
  authDomain: "eduauthentication-88b27.firebaseapp.com",
  projectId: "eduauthentication-88b27",
  storageBucket: "eduauthentication-88b27.firebasestorage.app",
  messagingSenderId: "210109566011",
  appId: "1:210109566011:web:53e6cc813ad0ede37ba01e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google provider with email scope
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email'); // Request email access
googleProvider.addScope('profile'); // Request profile access

// Initialize GitHub provider with email scope
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email'); // Request email access
githubProvider.addScope('read:user');  // Request user profile access

export default app;
