import { Platform } from 'react-native';
import { app, messaging } from '../firebaseConfig';
import { getToken } from 'firebase/messaging';

export const notificationService = {
  /**
   * Registers for Web Push Notifications using Service Workers.
   */
  async registerForPushNotificationsAsync(phone) {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported or not on Web.');
      return null;
    }

    try {
      const isWeb = Platform.OS === 'web';
      const API_URL = isWeb ? '/api' : 'http://192.168.1.X:3000/api';

      // 1. Request Notification Permission safely
      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        console.warn('Notification permission not granted.');
        return null;
      }

      // 2. Register Service Worker for FCM
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Firebase Service Worker registered with scope:', registration.scope);

      // Wait until the service worker is active
      await navigator.serviceWorker.ready;

      // 3. Get FCM Token
      const currentToken = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: 'BL6jIytwaACVXIDf9iTXZYryjxEjs_8FpV30X9S39cEDjDXXPBI0QJ-e7xRcL6aTcxdfx0QT6ksKEoef8-Nm3Jc'
      });

      if (!currentToken) {
        console.warn('No registration token available. Request permission to generate one.');
        return null;
      }

      // 4. Send Token to Backend
      await fetch(`${API_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phone,
          fcmToken: currentToken
        })
      });

      console.log('Successfully subscribed to FCM Push Notifications.');
      return currentToken;
    } catch (error) {
      console.error('Error during Web Push registration:', error);
      return null;
    }
  },

  /**
   * Dummy placeholder for sendPushNotification.
   * Real notifications are now sent by the backend.
   */
  async sendPushNotification() {
    console.warn('sendPushNotification is now handled entirely by the backend.');
  },

  /**
   * Unsubscribes from Web Push Notifications by removing the token from the backend.
   */
  async unsubscribeFromPushNotificationsAsync(phone) {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const isWeb = Platform.OS === 'web';
      const API_URL = isWeb ? '/api' : 'http://192.168.1.X:3000/api';

      const registration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: 'BL6jIytwaACVXIDf9iTXZYryjxEjs_8FpV30X9S39cEDjDXXPBI0QJ-e7xRcL6aTcxdfx0QT6ksKEoef8-Nm3Jc'
      });

      if (currentToken) {
        await fetch(`${API_URL}/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: phone,
            fcmToken: currentToken
          })
        });
      }
      console.log('Successfully unsubscribed from FCM Push Notifications.');
      return true;
    } catch (error) {
      console.error('Error during Web Push unsubscription:', error);
      return false;
    }
  }
};
