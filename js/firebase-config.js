// js/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyD9XyvgofyFyX5aUMARcA_GO-N2Tcw725Q",
  authDomain: "goodhifzicell.firebaseapp.com",
  databaseURL: "https://goodhifzicell-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "goodhifzicell",
  storageBucket: "goodhifzicell.firebasestorage.app",
  messagingSenderId: "306835710868",
  appId: "1:306835710868:web:817551e6c8c19c8eca6581"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// Export for modules
window.db = db;
window.auth = auth;
window.storage = storage;
