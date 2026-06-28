import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB-TzOLPxOObBJ9tRtNsCo8Dw_ppcNoTyw",
  authDomain: "travhub-9b75b.firebaseapp.com",
  projectId: "travhub-9b75b",
  storageBucket: "travhub-9b75b.firebasestorage.app",
  messagingSenderId: "377945042573",
  appId: "1:377945042573:web:e139b306f7b109c1bcbcc4",
  measurementId: "G-745BMD38HH"
};

const app = initializeApp(firebaseConfig);

let messaging;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

export { app, messaging };
