const mongoose = require('mongoose');
const { webPush } = require('./webpush');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/travhub';

async function sendTest() {
  await mongoose.connect(mongoURI);
  console.log('Connected to DB');
  const user = await User.findOne({ phone: '9654875200' });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  if (!user.webPushSubscriptions || user.webPushSubscriptions.length === 0) {
    console.log('No web push subscriptions found for this user');
    process.exit(1);
  }
  console.log(`Found ${user.webPushSubscriptions.length} subscriptions`);
  const payload = JSON.stringify({
    title: 'Test Notification',
    body: 'Hello! Your PWA notifications are working perfectly.',
    url: '/'
  });

  for (let sub of user.webPushSubscriptions) {
    try {
      await webPush.sendNotification(sub, payload);
      console.log('Notification sent successfully');
    } catch (err) {
      console.error('Failed to send to a subscription', err);
    }
  }
  process.exit(0);
}
sendTest();
