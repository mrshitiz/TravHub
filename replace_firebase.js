const fs = require('fs');
const path = require('path');

const files = [
  'c:/TravHub/mobile_app/src/components/CommentsModal.js',
  'c:/TravHub/mobile_app/src/screens/ChatScreen.js',
  'c:/TravHub/mobile_app/src/screens/NotificationsScreen.js',
  'c:/TravHub/mobile_app/src/screens/ProfileScreen.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace import
  content = content.replace(
    /import \{ firebaseService \} from '\.\.\/services\/firebaseService';/g,
    "import { apiService } from '../services/apiService';"
  );
  
  // Replace references
  content = content.replace(/firebaseService\./g, 'apiService.');
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
