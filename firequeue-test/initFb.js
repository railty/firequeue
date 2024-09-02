// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPduJ9JFFktNSI-Qz26JcZUl0x_erABaI",
  authDomain: "firequeue-97bc2.firebaseapp.com",
  projectId: "firequeue-97bc2",
  storageBucket: "firequeue-97bc2.appspot.com",
  messagingSenderId: "820363582485",
  appId: "1:820363582485:web:79f77cc223ddf244b6421c",
  measurementId: "G-5YMRRL70JS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const auth = getAuth();
export const firestore = getFirestore();
