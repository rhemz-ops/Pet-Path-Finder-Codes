import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyA1a6yIV2nXbGcNZHke7E_8VlX0UmAmi_E",
    authDomain: "pet-path-finder-app-98bde.firebaseapp.com",
    projectId: "pet-path-finder-app-98bde",
    storageBucket: "pet-path-finder-app-98bde.appspot.com",
    messagingSenderId: "267741703627",
    appId: "1:267741703627:web:56d3a0f2b30628757d9a4e"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { firestore, storage, collection, doc, setDoc, ref, uploadBytes, getDownloadURL };
