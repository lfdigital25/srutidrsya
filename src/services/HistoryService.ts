import { collection, doc, setDoc, getDocs, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface WatchHistoryItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  uploaderId: string;
  duration: number;
  viewedAt: Timestamp;
}

export const HistoryService = {
  async addToHistory(video: any) {
    const user = auth.currentUser;
    if (!user) return; // Only save history if logged in

    try {
      const historyRef = doc(db, `users/${user.uid}/history`, video.id);
      await setDoc(historyRef, {
        videoId: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        uploaderId: video.uploaderId,
        duration: video.duration,
        viewedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  },

  async getHistory(): Promise<WatchHistoryItem[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const historyRef = collection(db, `users/${user.uid}/history`);
      const snapshot = await getDocs(historyRef);
      return snapshot.docs.map(doc => doc.data() as WatchHistoryItem).sort((a, b) => b.viewedAt.toMillis() - a.viewedAt.toMillis());
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  async cleanupOldHistory(onWarning: (deletedCount: number) => void) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const historyRef = collection(db, `users/${user.uid}/history`);
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      
      const q = query(historyRef, where('viewedAt', '<', Timestamp.fromDate(fifteenDaysAgo)));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return;

      let deletedCount = 0;
      for (const document of snapshot.docs) {
        await deleteDoc(document.ref);
        deletedCount++;
      }

      if (deletedCount > 0) {
        onWarning(deletedCount);
      }
    } catch (error) {
      console.error('Failed to cleanup history:', error);
    }
  }
};
