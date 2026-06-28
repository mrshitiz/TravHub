import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBCAbRsJR80AeMDMUROAVzif6aPHVuJr5A",
  authDomain: "travhub-d38c3.firebaseapp.com",
  projectId: "travhub-d38c3",
  storageBucket: "travhub-d38c3.firebasestorage.app",
  messagingSenderId: "1019132706939",
  appId: "1:1019132706939:web:e2cdf3a634d24fbb50a2de",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("Fetching all chats...");
  const chatsRef = collection(db, 'chats');
  const snap = await getDocs(chatsRef);
  
  if (snap.empty) {
    console.log("No chats found to delete.");
    process.exit(0);
  }

  let count = 0;
  for (const document of snap.docs) {
    // Delete messages subcollection
    const msgsRef = collection(db, 'chats', document.id, 'messages');
    const msgsSnap = await getDocs(msgsRef);
    for (const msgDoc of msgsSnap.docs) {
      await deleteDoc(doc(db, 'chats', document.id, 'messages', msgDoc.id));
    }
    
    // Delete chat document
    await deleteDoc(doc(db, 'chats', document.id));
    count++;
    console.log(`Deleted chat ${document.id} and its messages`);
  }

  console.log(`Successfully deleted ${count} chats.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error deleting chats:', err);
  process.exit(1);
});
