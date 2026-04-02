// Konfigurasi Firebase WebPOS
const firebaseConfig = {
    apiKey: "AIzaSyD9XyvgofyFyX5aUMARcA_GO-N2Tcw725Q",
    authDomain: "goodhifzicell.firebaseapp.com",
    databaseURL: "https://goodhifzicell-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "goodhifzicell",
    storageBucket: "goodhifzicell.firebasestorage.app",
    messagingSenderId: "306835710868",
    appId: "1:306835710868:web:817551e6c8c19c8eca6581"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Export untuk digunakan di file lain
const auth = firebase.auth();
const database = firebase.database();

// Fungsi helper untuk cek koneksi
function checkFirebaseConnection() {
    const connectedRef = database.ref(".info/connected");
    connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
            console.log("Firebase terhubung");
        } else {
            console.log("Firebase tidak terhubung");
        }
    });
}

// Export variabel
window.auth = auth;
window.database = database;
