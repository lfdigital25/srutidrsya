import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Trash2, ArrowLeft } from 'lucide-react';
import { HistoryService, WatchHistoryItem } from '../services/HistoryService';

export default function WatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const historyData = HistoryService.getHistory();
    setHistory(historyData);
    setLoading(false);
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/profile" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-neutral-200" />
        </Link>
        <h1 className="text-2xl font-bold text-neutral-100">Watch History</h1>
      </div>

      <div className="bg-neutral-900/50 rounded-xl p-4 mb-6 border border-neutral-800 flex items-start gap-3">
        <Clock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-neutral-400">
          Your watch history is automatically deleted after 15 days for your privacy. 
          You will receive a notification when old videos are removed.
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-neutral-500">Loading history...</div>
      ) : history.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {history.map((video) => (
            <Link to={`/video/${video.videoId}`} key={video.videoId} className="flex gap-4 group hover:bg-neutral-900 p-2 rounded-xl transition-colors">
              <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0">
                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-medium">
                  {formatDuration(video.duration)}
                </div>
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className="text-neutral-100 font-semibold line-clamp-2 group-hover:text-red-500 transition-colors">{video.title}</h3>
                <p className="text-sm text-neutral-400 mt-1">{video.uploaderId}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Watched on {new Date(video.viewedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
          <Clock className="w-12 h-12 mb-4 opacity-20" />
          <p>Your watch history is empty.</p>
        </div>
      )}
    </div>
  );
}
