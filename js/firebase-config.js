// ==========================================
// KONFIGURASI FIREBASE (Kunci Sebenar e-Latihan)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA38C0QgzRO6kLjwd4_7VPj_bCKzjx0JbE",
  authDomain: "e-latihan-hasa-staff.firebaseapp.com",
  projectId: "e-latihan-hasa-staff",
  storageBucket: "e-latihan-hasa-staff.firebasestorage.app",
  messagingSenderId: "259950144506",
  appId: "1:259950144506:web:b0a6c7a894000e154ad243"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Jadikan pembolehubah (variable) ini global
const auth = firebase.auth();
const db = firebase.firestore();