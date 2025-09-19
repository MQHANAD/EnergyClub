import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';


// firebase.ts


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
  // Use the env-provided bucket value as-is (e.g., "university-club-platform.firebasestorage.app")
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
};

if (process.env.NODE_ENV !== 'production') {
  console.log('Firebase config loaded:', {
    apiKey: firebaseConfig.apiKey ? '***' : 'MISSING',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

let appCheckInited = false;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize App Check on the client if available
if (typeof window !== 'undefined' && !appCheckInited) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // Enable debug token for local/dev to bypass enforcement in development
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;

    if (siteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckInited = true;
      if (process.env.NODE_ENV !== 'production') {
        console.log('App Check initialized with reCAPTCHA v3 provider');
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'App Check site key missing (NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY). ' +
          'Running with debug token in dev. For production, set the site key and add your domain in Firebase Console.'
        );
      }
    }
  } catch (e) {
    console.warn('App Check initialization failed', e);
  }
}


// Note: App Check disabled in development for testing - should be re-enabled for production

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Set persistence to local storage for auth state persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const storage = getStorage(app);
if (process.env.NODE_ENV !== 'production') {
  console.log('Storage bucket (env-provided):', firebaseConfig.storageBucket);
}

// Google Auth Provider
// Google provider removed - now using email/password authentication

export default app;