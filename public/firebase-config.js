/**
 * Paste your Firebase web app config here.
 *
 * Firebase Console → Project settings (gear) → Your apps → Web app → Config
 *
 * Also enable Firestore: Build → Firestore Database → Create database
 * (start in test mode, then paste firestore.rules from this repo)
 */
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

// Set true only after you paste real values above
const FIREBASE_CONFIGURED =
  firebaseConfig.apiKey !== "PASTE_API_KEY" &&
  firebaseConfig.projectId !== "PASTE_PROJECT_ID";
