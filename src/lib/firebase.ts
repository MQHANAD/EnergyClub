import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// firebase.ts


function sanitizeStorageBucket(input?: string | null): string | undefined {
  if (!input) return undefined;
  const v = input.toString().trim();
  return v || undefined;
}

const sanitizedBucket = sanitizeStorageBucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
  ...(sanitizedBucket ? { storageBucket: sanitizedBucket } : {}),
};

let appCheckInited = false;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize App Check (browser-only) - Temporarily disabled for testing
if (typeof window !== 'undefined' && !appCheckInited && process.env.NODE_ENV === 'production') {
  const v3Key = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY?.toString().trim();
  const debugEnv = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;

  // Ensure App Check debug token is set before any initializeAppCheck call
  if (typeof debugEnv === 'string' && debugEnv.length) {
    const g = globalThis as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean };
    g.FIREBASE_APPCHECK_DEBUG_TOKEN = (debugEnv === 'true' ? true : debugEnv);
  }

  if (v3Key) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(v3Key),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInited = true;
  } else if (typeof debugEnv === 'string' && debugEnv) {
    const fallbackV3Key = v3Key || 'unused';
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(fallbackV3Key),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInited = true;
  }
}
// Note: App Check disabled in development for testing - should be re-enabled for production

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;