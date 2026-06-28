# TravHub Mobile Application Guidelines

## 1. Development & Verification Commands
* **Start local server**: `npm run start` / `npx expo start`
* **Verify code syntax check**:
  ```bash
  node -c App.js src/constants/constants.js src/utils/helpers.js src/hooks/useAuth.js src/hooks/useProfile.js src/hooks/useFeed.js src/components/ImageCarousel.js src/components/LogoCropper.js src/components/PostCard.js src/components/PostModal.js src/components/PostQuickViewModal.js src/components/ProfileEditorModal.js src/components/FloatingConsole.js src/screens/WelcomeScreen.js src/screens/FeedScreen.js src/screens/ProfileScreen.js src/screens/ChatScreen.js
  ```
* **Lint codebase**: `npm run lint` (when ESLint is set up)

## 2. Codebase Architecture & File Boundaries
To maintain a high-quality production standard, prevent the growth of monolithic files, and follow the **Component-ViewModel-Service** pattern:

### Standard File Sizes & Splitting Rules
* **Max file length**: No code file (except configuration) should exceed **350 lines**. If it grows past this, extract sub-views, constants, or helper functions immediately.
* **Separation of concerns**:
  * **Visual Screens (`src/screens/`)**: Presentational layout wrapper code only.
  * **Reusable Components (`src/components/`)**: Visual widgets (buttons, cards, inputs) only.
  * **Business Logic Hooks (`src/hooks/`)**: State management, hooks, and ViewModel controller logic.
  * **Database Services (`src/services/`)**: Firebase/Firestore connectors and raw CRUD logic.

### Strict Coding Constraints
1. **No direct Database imports in visual layers**: Visual files (`src/screens/*` and `src/components/*`) **must never** import `firebase/*` or run database commands. They must consume state and action handlers from hooks (`src/hooks/*`) or services (`src/services/*`).
2. **Path Resolution**: Assets must be resolved within the local React Native package root. For example, `travhub_logo.png` must be resolved relative to `src/utils/helpers.js` as `../../assets/travhub_logo.png`.
3. **No ad-hoc styling**: Keep styling definitions unified. Consume styles from `src/styles/themeStyles.js`.

## 3. Cross-Platform Rules (iOS & Android)

### Safe Area
* **DO NOT** wrap App.js root in `<SafeAreaView>` — use a plain `<View style={{ flex: 1 }}>` inside `<SafeAreaProvider>`.
* **Each screen** wraps its content with `<SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#050b14' }}>` to protect against notches and status bars.
* **Bottom safe area** is handled by `FloatingConsole` dynamically using `useSafeAreaInsets().bottom`. Do not hardcode `bottom` pixel values.
* **Modal bottom sheets** must use `paddingBottom: Math.max(insets.bottom, N)` for safe bottom padding.

### Android Back Button
* All back navigation is handled via `BackHandler` in `App.js`.
* Priority: modals → active chat → profile → chats → feed (exit confirmation).
* Always return `true` from the handler when you intercept a press.
* Clean up with `subscription.remove()` in the `useEffect` return.

### StatusBar
* **One** global `<StatusBar barStyle="light-content" backgroundColor="#050b14" translucent={false} />` in `App.js`.
* Do **NOT** add `<StatusBar>` inside individual screens.

### Keyboard
* In `KeyboardAvoidingView`: use `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`.
* Never use `behavior={undefined}` on Android — the keyboard will cover the input.

### Content Padding
* Screens with `FloatingConsole` must have `paddingBottom: 120` minimum on scroll content.
* Defined in `themeStyles.js` as `feedContent` and `igProfileScroll` styles — do not override locally.
