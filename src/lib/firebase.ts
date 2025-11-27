import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ----------------------
// APP CHECK (ENTERPRISE)
// ----------------------
if (typeof window !== "undefined") {
  // Enable debug token in dev
  if (process.env.NODE_ENV !== "production") {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
      process.env.NEXT_PUBLIC_FIREBASE_DEBUG_TOKEN;
  }

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;

  if (!siteKey) {
    console.error("❌ Missing reCAPTCHA ENTERPRISE site key!");
  } else {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log("✅ App Check initialized WITH reCAPTCHA ENTERPRISE");
  }
}

// ----------------------
// AUTH
// ----------------------
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// ----------------------
// FIRESTORE & STORAGE
// ----------------------
export const db = getFirestore(app);
export const storage = getStorage(app);

// ----------------------
// ANALYTICS
// ----------------------
let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((okay) => {
    if (okay) analytics = getAnalytics(app);
  });
}
export { analytics };

export default app;
