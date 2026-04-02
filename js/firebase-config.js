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
const storage = firebase.storage();

// Fungsi helper untuk cek koneksi
function checkFirebaseConnection() {
    const connectedRef = database.ref(".info/connected");
    connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
            console.log("Firebase terhubung");
            updateCloudStatus(true);
        } else {
            console.log("Firebase tidak terhubung");
            updateCloudStatus(false);
        }
    });
}

// Update status cloud di UI
function updateCloudStatus(isConnected) {
    const cloudBtn = document.getElementById('cloud-status');
    if (cloudBtn) {
        if (isConnected) {
            cloudBtn.classList.remove('offline');
            cloudBtn.classList.add('online');
            cloudBtn.innerHTML = '<i class="fas fa-cloud"></i> Online';
        } else {
            cloudBtn.classList.remove('online');
            cloudBtn.classList.add('offline');
            cloudBtn.innerHTML = '<i class="fas fa-cloud-slash"></i> Offline';
        }
    }
}

// Export variabel dan fungsi
window.firebaseConfig = firebaseConfig;
window.auth = auth;
window.database = database;
window.storage = storage;
window.checkFirebaseConnection = checkFirebaseConnection;
