
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_vo2rp4ofS6a6Ii64S0FqPN7zf3MYwQ0",
  authDomain: "ce-power.firebaseapp.com",
  projectId: "ce-power",
  storageBucket: "ce-power.firebasestorage.app",
  messagingSenderId: "660755487537",
  appId: "1:660755487537:web:b41139f5e5955e2b14ae10"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
