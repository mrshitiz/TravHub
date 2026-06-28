/**
 * seed_messages.mjs
 * Sends mock messages from multiple companies to caretrip (9654875200)
 * Run: node seed_messages.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  increment
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

const CARETRIP_PHONE = '9654875200';

// Mock companies that will send messages to caretrip
const mockSenders = [
  {
    phone: 'MOCK_001',
    agencyName: 'Horizon Holidays',
    city: 'Mumbai',
    agencyLogo: '🏝️',
    handlingPerson: 'Ravi Sharma',
    messages: [
      'Hi! We came across your listing on TravHub. We deal in Maldives & Bali packages.',
      'We have exclusive B2B rates for Maldives water villas — interested in a tie-up?',
      'Our packages start from ₹45,000 per person twin sharing. Can we schedule a call?',
      'Also attaching our brochure — we cover airport transfers, 4N/5D itineraries.',
      'Looking forward to a long-term partnership with CaretTrip! 🤝'
    ]
  },
  {
    phone: 'MOCK_002',
    agencyName: 'Alpine Treks',
    city: 'Delhi',
    agencyLogo: '🏔️',
    handlingPerson: 'Priya Nair',
    messages: [
      'Hello CareTrip! Alpine Treks here — we specialise in Himachal & Uttarakhand treks.',
      'We have fixed departure group treks every weekend from Delhi for Triund, Hampta, Kedarkantha.',
      'B2B rates available: ₹3,500 per pax for 2N Triund trek including camping & meals.',
      'We also offer customised packages for corporate team outings — 20+ pax gets 15% off.',
      'Can you share your client profile? Would love to propose the right fit! 😊'
    ]
  },
  {
    phone: 'MOCK_003',
    agencyName: 'Royal Rajasthan Tours',
    city: 'Jaipur',
    agencyLogo: '🏰',
    handlingPerson: 'Deepak Verma',
    messages: [
      'Namaste! Royal Rajasthan Tours based in Jaipur. We handle the entire Rajasthan circuit.',
      'Jaipur → Jodhpur → Jaisalmer → Udaipur — 7N/8D with heritage hotel stays.',
      'We have dedicated guide + vehicle + hotel combos at net B2B rates.',
      'Peak season (Oct-Mar) slots filling fast — suggest you block inventory now.',
      'WhatsApp us your client count and travel dates and we will send a quotation within 2 hours!'
    ]
  },
  {
    phone: 'MOCK_004',
    agencyName: 'Suncoast Cruises',
    city: 'Kochi',
    agencyLogo: '🚢',
    handlingPerson: 'Anita Menon',
    messages: [
      'Hey there! Suncoast Cruises from Kochi — we do Kerala backwater cruises & Lakshadweep packages.',
      'Our 2N Alleppey houseboat packages start at ₹8,500 per couple (net B2B).',
      'Lakshadweep permits are getting trickier — we have pre-arranged slots for this season!',
      'Coral reef snorkelling, island hopping, unlimited seafood — clients absolutely love it.',
      'DM us if you want our rate card PDF. Happy to collaborate on Lakshadweep for your clients! 🌊'
    ]
  },
  {
    phone: 'MOCK_005',
    agencyName: 'EuroWings Travel',
    city: 'Bangalore',
    agencyLogo: '✈️',
    handlingPerson: 'Siddharth Rao',
    messages: [
      'Hi CareTrip! EuroWings Travel — we are a Europe specialist DMC based in Bangalore.',
      'Schengen visa assistance, hotel + rail passes + guided tours — all under one roof.',
      'Switzerland 5N/6D packages net B2B from ₹85,000 per person including flights.',
      'We also have exclusive contracts with river cruise operators for Danube & Rhine.',
      'Currently running a flash offer: book 10 pax for Europe and get 1 FOC. Valid till month end!'
    ]
  }
];

function getTimeString() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

async function findOrCreateChat(sender) {
  const chatsRef = collection(db, 'chats');

  // Check if chat already exists
  const q = query(chatsRef, where('participants', 'array-contains', CARETRIP_PHONE));
  const snap = await getDocs(q);

  let existingChatId = null;
  snap.forEach(d => {
    const data = d.data();
    if (data.participants && data.participants.includes(sender.phone)) {
      existingChatId = d.id;
    }
  });

  if (existingChatId) {
    console.log(`  ↩️  Reusing existing chat for ${sender.agencyName}: ${existingChatId}`);
    return existingChatId;
  }

  // Create new chat room
  const chatDoc = {
    participants: [sender.phone, CARETRIP_PHONE],
    participantDetails: {
      [sender.phone]: {
        agencyName: sender.agencyName,
        city: sender.city,
        agencyLogo: sender.agencyLogo,
        handlingPerson: sender.handlingPerson
      },
      [CARETRIP_PHONE]: {
        agencyName: 'CareTrip',
        city: 'Delhi',
        agencyLogo: '🌍',
        handlingPerson: ''
      }
    },
    lastMessage: '',
    lastMessageTime: getTimeString(),
    lastSender: '',
    unread: false,
    unreadCount: 0,
    updatedAt: new Date().toISOString()
  };

  const ref = await addDoc(chatsRef, chatDoc);
  console.log(`  ✅ Created new chat for ${sender.agencyName}: ${ref.id}`);
  return ref.id;
}

async function sendMessages(chatId, sender) {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const chatDocRef = doc(db, 'chats', chatId);

  for (let i = 0; i < sender.messages.length; i++) {
    const text = sender.messages[i];
    const now = new Date(Date.now() + i * 60000); // 1 min apart
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    await addDoc(messagesRef, {
      senderPhone: sender.phone,
      text,
      time: timeString,
      timestamp: now.toISOString(),
      read: false,
      received: false
    });

    // Update chat meta after each message
    await updateDoc(chatDocRef, {
      lastMessage: text,
      lastMessageTime: timeString,
      lastSender: sender.phone,
      unread: true,
      unreadCount: increment(1),
      updatedAt: now.toISOString()
    });

    console.log(`    📨 [${sender.agencyName}] msg ${i + 1}: "${text.substring(0, 50)}..."`);

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }
}

async function main() {
  console.log(`\n🚀 Seeding messages to CareTrip (${CARETRIP_PHONE})\n`);

  for (const sender of mockSenders) {
    console.log(`\n📬 Processing: ${sender.agencyName} (${sender.city})`);
    try {
      const chatId = await findOrCreateChat(sender);
      await sendMessages(chatId, sender);
      console.log(`  ✅ Done — ${sender.messages.length} messages sent`);
    } catch (err) {
      console.error(`  ❌ Error for ${sender.agencyName}:`, err.message);
    }
  }

  console.log('\n✅ All done! CareTrip inbox is now populated.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
