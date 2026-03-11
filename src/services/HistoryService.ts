const HISTORY_KEY = 'sruti-drsya-watch-history';

export interface WatchHistoryItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  uploaderId: string;
  duration: number;
  viewedAt: number; // Use a timestamp (number) instead of Firestore's Timestamp
}

export const HistoryService = {
  async addToHistory(video: any) {
    try {
      let history = this.getHistory();
      // Remove existing entry if it exists to move it to the top
      history = history.filter(item => item.videoId !== video.id);
      
      const newItem: WatchHistoryItem = {
        videoId: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        uploaderId: video.uploaderId,
        duration: video.duration,
        viewedAt: Date.now(),
      };

      // Add the new item to the beginning of the array
      history.unshift(newItem);

      // Limit history to a reasonable number, e.g., 100 items
      if (history.length > 100) {
        history = history.slice(0, 100);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  },

  getHistory(): WatchHistoryItem[] {
    try {
      const historyJson = localStorage.getItem(HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  cleanupOldHistory(onWarning: (deletedCount: number) => void) {
    try {
      let history = this.getHistory();
      const originalLength = history.length;
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      
      const filteredHistory = history.filter(item => item.viewedAt > fifteenDaysAgo.getTime());

      const deletedCount = originalLength - filteredHistory.length;

      if (deletedCount > 0) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
        onWarning(deletedCount);
      }
    } catch (error) {
      console.error('Failed to cleanup history:', error);
    }
  }
};
