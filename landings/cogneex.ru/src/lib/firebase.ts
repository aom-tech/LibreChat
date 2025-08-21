import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Инициализация Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount: ServiceAccount = {
    projectId: import.meta.env.FB_PROJECT_ID,
    clientEmail: import.meta.env.FB_CLIENT_EMAIL,
    privateKey: import.meta.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = getFirestore();