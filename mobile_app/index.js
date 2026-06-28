import { registerRootComponent } from 'expo';
import { Platform, LogBox } from 'react-native';

import App from './App';

// Suppress deprecated shadow props warning in console
LogBox.ignoreLogs([
  '"shadow*" style props are deprecated. Use "boxShadow"',
  'Animated: `useNativeDriver` is not supported'
]);

// Web-specific CSS injections
if (Platform.OS === 'web') {
  const globalStyles = `
  /* Sleek Dark Theme Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(14, 165, 233, 0.3);
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(14, 165, 233, 0.6);
  }
  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(14, 165, 233, 0.3) transparent;
  }`;
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(globalStyles));
  document.head.appendChild(style);
}

registerRootComponent(App);
