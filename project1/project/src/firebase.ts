// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDd_bY9cOw58yR2KcIPbRmL5i6QRBj8xv8",
  authDomain: "payroll-f4f0a.firebaseapp.com",
  databaseURL: "https://payroll-f4f0a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "payroll-f4f0a",
  storageBucket: "payroll-f4f0a.firebasestorage.app",
  messagingSenderId: "1079306013303",
  appId: "1:1079306013303:web:be5425a1fdfbcb22925472",
  measurementId: "G-9CYEF4P07S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);  // Optional
export const db = getDatabase(app);          // ✅ Export this to fix the error
