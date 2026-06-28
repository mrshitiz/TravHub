import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "dummy",
  authDomain: "travhub-app.firebaseapp.com",
  projectId: "travhub-app",
  storageBucket: "travhub-app.appspot.com",
  messagingSenderId: "dummy",
  appId: "dummy"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTokens() {
  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`Phone: ${doc.id}, Push Token: ${data.expoPushToken ? data.expoPushToken : 'NULL'}`);
  });
  process.exit(0);
}

checkTokens().catch(err => {
  console.error("Error reading firebase:", err);
  process.exit(1);
});
