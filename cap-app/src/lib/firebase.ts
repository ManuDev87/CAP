import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkp_dWIG6WdZ_hPLBT--Uo2fVi85ulK7U",
  authDomain: "grupo-cap.firebaseapp.com",
  projectId: "grupo-cap",
  storageBucket: "grupo-cap.firebasestorage.app",
  messagingSenderId: "1079029475525",
  appId: "1:1079029475525:web:d615b4b8b7cbff929528ac",
};

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Offline persistence: pending writes (paused tests, results) are queued
 * locally and synced when the connection comes back — key for the PWA.
 * Falls back to in-memory persistence during prerender / HMR re-init.
 */
function createDb(): Firestore {
  if (typeof window === "undefined") return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Already initialized (Fast Refresh) — reuse the existing instance.
    return getFirestore(app);
  }
}

export const db = createDb();
