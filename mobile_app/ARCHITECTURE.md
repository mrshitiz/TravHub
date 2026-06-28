# TravHub Application Architecture

This document outlines the official architectural guidelines, folder layout, state management conventions, and engineering rules for the TravHub platform.

---

## 1. High-Level Architecture (100% PWA + Custom Backend)

TravHub has transitioned from a Firebase BaaS model to a strict **Progressive Web App (PWA)** backed by a custom Node.js server. 
* **Frontend:** Built with React Native & Expo Web. The app is deployed strictly as a PWA (`npm run web`). We no longer maintain or compile Android (.apk) or iOS (.ipa) builds.
* **Backend:** Custom API written in Node.js / Express, residing in the `c:\TravHub\backend` directory.
* **Database:** MongoDB (using Mongoose).
* **Notifications:** W3C Web Push API utilizing Service Workers on the frontend and VAPID-secured `web-push` payloads on the backend.

---

## 2. Directory Structure

```
TravHub/
├── backend/                   # Custom Node.js & MongoDB Server
│   ├── mongodb_data/          # Local database storage
│   ├── node_modules/          
│   ├── server.js              # Express/Socket.io Entry Point
│   └── package.json           
├── mobile_app/                # React Native / Expo Frontend
│   ├── App.js                 # Root Entry point & Top-level Navigation setup
│   ├── firebase.js            # FCM initialization config
│   ├── ARCHITECTURE.md        # Architectural Guidelines (this file)
│   └── src/
│       ├── api/               # API clients to talk to the Node.js backend
│       ├── services/          # Core infrastructure services (Notifications, etc)
│       ├── hooks/             # Business Logic and ViewModels (state/lifecycle management)
│       ├── components/        # Shared, reusable presentational UI elements
│       ├── screens/           # Screen-level layout wrappers and configurations
│       ├── constants/         # Static configurations, theme colors, static data
│       └── utils/             # Pure helper functions (formatting, validation, compressors)
├── start_app.bat              # Script to start the Expo Web (PWA) server
└── start_backend.bat          # Script to start MongoDB and Node.js server
```

---

## 2. Layered Responsibilities (The Rules)

### View Layer (`src/screens/` & `src/components/`)
* **Rule**: UI components should be **presentational only**.
* **Rule**: No queries or CRUD calls. Do not import `firebase/firestore` or run database commands inside visual templates.
* **Rule**: Delegate state management and logic (e.g., fetch routines, validation) to custom hooks.

### State & Logic Layer (`src/hooks/`)
* **Rule**: Business logic belongs here. Custom hooks act as **ViewModels**.
* **Rule**: Fetch, transform, update, and manage state in hooks and return ready-to-render state and handlers.
* **Rule**: Trigger services in async actions and handle loading/error states cleanly.

### Service & Data Layer (`src/services/`)
* **Rule**: Core database connectors belong here.
* **Rule**: Write clean, reusable, testable functions that connect to Firestore or Auth.
* **Rule**: Return standardized models/objects or throw clean error messages.

---

## 3. Production Readiness Best Practices

1. **Robust Error Boundaries**: Wrap critical views (especially home feed and profile gestures) to capture exceptions and fallback gracefully.
2. **Optimistic Loading States**: Show skeletons/spinners for all network requests.
3. **Environment Separation**: Do not hardcode database URLs or API keys inside code. Use Expo secrets or `.env` configurations.
4. **Offline Support**: Ensure app survives network dropping. Use cached values or robust checks before running async calls.
5. **Code Uniformity**: Format using strict ESLint and Prettier rules.

---

## 4. Cross-Platform & Safe Area Rules

These rules ensure the app works perfectly on all iOS and Android devices — including notched phones, devices with dynamic/gesture navigation bars, and phones with hardware buttons.

### 4.1 Safe Area Management

**Pattern**: Each screen owns its own top safe area. The bottom is handled by the `FloatingConsole` component which uses `useSafeAreaInsets` dynamically.

```
App.js
└── SafeAreaProvider          ← Required once at root
    └── View (flex: 1)        ← Plain View, NOT SafeAreaView
        ├── FeedScreen        ← SafeAreaView edges={['top']} — avoids notch
        ├── ProfileScreen     ← SafeAreaView edges={['top']} — avoids notch
        ├── ChatScreen        ← SafeAreaView edges={['top']} — avoids notch
        └── FloatingConsole   ← Uses useSafeAreaInsets().bottom for dynamic position
```

* **Rule**: Never use a root `<SafeAreaView>` without `edges` prop — this double-pads on devices with a home indicator.
* **Rule**: Always use `edges={['top']}` on screen-level `SafeAreaView` wrappers unless you explicitly need bottom handling too.
* **Rule**: `WelcomeScreen` has its own full `<SafeAreaView>` because it renders in place of the entire app (no wrapper context).
* **Rule**: Modal bottom sheets must use `paddingBottom: Math.max(insets.bottom, minimumPadding)` for safe bottom padding.

### 4.2 Android Back Button

**Pattern**: `BackHandler` is registered in `App.js` with a prioritized handler chain.

Priority order (highest to lowest):
1. Close open modals (grid post view, comments, action menu, post modal, profile editor)
2. Close active chat (return to chat list)
3. Navigate from `profile` → `feed`
4. Navigate from `chats` → `feed`
5. On `feed` screen → show "Exit App?" confirmation dialog
6. Return `false` on `welcome` screen (let OS handle)

* **Rule**: Always return `true` from `BackHandler` callbacks when you handle navigation — this prevents the OS from also handling it (double action).
* **Rule**: Register `BackHandler` inside `useEffect` and clean up with `subscription.remove()` on unmount.
* **Rule**: Include all state values referenced inside the handler in the `useEffect` dependency array.

### 4.3 StatusBar

* **Rule**: Set `<StatusBar barStyle="light-content" backgroundColor="#050b14" translucent={false} />` **once** in `App.js`. Do NOT set it in individual screens.
* **Rule**: `translucent={false}` on Android ensures the status bar does not overlap content.
* **Rule**: `backgroundColor="#050b14"` on Android paints the status bar to match the app background.

### 4.4 Keyboard Avoiding View (Chat)

```jsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={0}
>
```

* **Rule**: Always set `behavior='height'` on Android (not `undefined`) — without it, the keyboard covers the input bar on Android.
* **Rule**: For iOS, use `behavior='padding'` to push content up above the keyboard.

### 4.5 Content Padding Under Floating Nav Bar

The floating navigation console is `64px` tall and positioned above the device bottom inset.

* **Rule**: Any scrollable content on screens that show the `FloatingConsole` must have `paddingBottom` of at least `120` (= 64px nav + ~20px inset + ~36px buffer).
* **Rule**: Defined in `themeStyles.js` as `feedContent.paddingBottom: 120` and `igProfileScroll.paddingBottom: 130`.
* **Rule**: Do NOT use `paddingBottom: 40` or similar small values on screens with the floating nav bar — content will be hidden behind it.
