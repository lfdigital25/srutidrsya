import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import VideoPlayer from './pages/VideoPlayer';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import WatchHistory from './pages/WatchHistory';
import { requestForToken, onMessageListener, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { HistoryService } from './services/HistoryService';

export default function App() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Request permission and get token
    requestForToken();

    // Listen for foreground messages
    const unsubscribe = onMessageListener((payload: any) => {
      console.log('Received foreground message:', payload);
      if (payload?.notification) {
        setToastMessage(`${payload.notification.title}: ${payload.notification.body}`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    });

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        HistoryService.cleanupOldHistory((deletedCount) => {
          const msg = `Warning: ${deletedCount} video(s) older than 15 days have been automatically deleted from your watch history for privacy.`;
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 8000);
          
          // Trigger local notification (simulating FCM)
          if (Notification.permission === 'granted') {
            new Notification('Watch History Cleaned', {
              body: msg,
              icon: '/vite.svg'
            });
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      authUnsubscribe();
    };
  }, []);

  return (
    <Router>
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <span className="font-medium text-sm">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="video/:id" element={<VideoPlayer />} />
          <Route path="profile" element={<Profile />} />
          <Route path="history" element={<WatchHistory />} />
          <Route path="search" element={<Search />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </Router>
  );
}
