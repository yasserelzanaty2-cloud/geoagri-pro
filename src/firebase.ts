import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export type GoogleSignInOutcome =
  | { status: 'signed_in'; user: User }
  | { status: 'redirecting' }
  | { status: 'popup_blocked'; isInIframe: boolean }
  | { status: 'cancelled' }
  | { status: 'unauthorized_domain'; host: string }
  | { status: 'error'; code: string; message: string };

function isEmbeddedIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

export async function signInWithGoogleSmart(): Promise<GoogleSignInOutcome> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { status: 'signed_in', user: result.user };
  } catch (err: unknown) {
    const firebaseErr = err as { code?: string; message?: string };
    const code = firebaseErr?.code || 'auth/unknown';
    const message = firebaseErr?.message || String(err);

    if (code === 'auth/popup-blocked') {
      const inIframe = isEmbeddedIframe();
      if (!inIframe) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { status: 'redirecting' };
        } catch {
          return { status: 'popup_blocked', isInIframe: false };
        }
      }
      return { status: 'popup_blocked', isInIframe: true };
    }

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { status: 'cancelled' };
    }

    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      return { status: 'unauthorized_domain', host };
    }

    return { status: 'error', code, message };
  }
}

export async function getGoogleAuthRedirectResult(): Promise<User | null> {
  try {
    const res = await getRedirectResult(auth);
    return res?.user ?? null;
  } catch {
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
