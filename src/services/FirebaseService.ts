import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { ScoreRecord, StorageService } from './StorageService';

export interface LeaderboardEntry {
  id?: string;
  playerName: string;
  heroName: string;
  survivalTime: number; // in seconds
  kills: number;
  level: number;
  gold: number;
  date: string;
}

export class FirebaseService {
  private static app: FirebaseApp | null = null;
  private static auth: Auth | null = null;
  private static db: Firestore | null = null;
  private static isConfigured: boolean = false;

  public static init(): void {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };

    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        if (!getApps().length) {
          this.app = initializeApp(firebaseConfig);
        } else {
          this.app = getApps()[0];
        }
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.isConfigured = true;

        // Anonymous Sign In
        signInAnonymously(this.auth).catch((err) => {
          console.warn('Firebase Anonymous sign-in error:', err);
        });
      } catch (err) {
        console.warn('Firebase init failed, using local offline storage:', err);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
  }

  public static async submitScore(
    playerName: string,
    record: ScoreRecord
  ): Promise<boolean> {
    // Always save to local storage
    StorageService.saveRunScore(record);

    if (!this.isConfigured || !this.db) {
      return false;
    }

    try {
      const scoresRef = collection(this.db, 'leaderboard');
      await addDoc(scoresRef, {
        playerName: playerName.trim() || 'Gizemli Savaşçı',
        heroName: record.heroName,
        survivalTime: Math.round(record.survivalTime),
        kills: record.kills,
        level: record.level,
        gold: record.gold,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (e) {
      console.warn('Failed to submit score to Firestore:', e);
      return false;
    }
  }

  public static async getTopScores(maxCount: number = 25): Promise<LeaderboardEntry[]> {
    if (!this.isConfigured || !this.db) {
      // Return local high scores
      const localData = StorageService.load();
      return localData.highScores.slice(0, maxCount).map((s, idx) => ({
        id: `local_${idx}`,
        playerName: 'Sen (Yerel)',
        heroName: s.heroName,
        survivalTime: s.survivalTime,
        kills: s.kills,
        level: s.level,
        gold: s.gold,
        date: s.date,
      }));
    }

    try {
      const scoresRef = collection(this.db, 'leaderboard');
      const q = query(scoresRef, orderBy('survivalTime', 'desc'), limit(maxCount));
      const snapshot = await getDocs(q);

      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          playerName: data.playerName || 'Bilinmeyen',
          heroName: data.heroName || 'Savaşçı',
          survivalTime: data.survivalTime || 0,
          kills: data.kills || 0,
          level: data.level || 1,
          gold: data.gold || 0,
          date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bugün',
        });
      });

      return entries;
    } catch (e) {
      console.warn('Failed to fetch from Firestore, falling back to local:', e);
      const localData = StorageService.load();
      return localData.highScores.slice(0, maxCount).map((s, idx) => ({
        id: `local_${idx}`,
        playerName: 'Sen (Yerel)',
        heroName: s.heroName,
        survivalTime: s.survivalTime,
        kills: s.kills,
        level: s.level,
        gold: s.gold,
        date: s.date,
      }));
    }
  }

  public static isFirebaseReady(): boolean {
    return this.isConfigured;
  }
}
