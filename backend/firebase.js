const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require('./firebase-key.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

module.exports = { app, messaging: getMessaging(app) };
