import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Eye, ShieldCheck } from 'lucide-react';
import { InterceptorLayer } from '../services/InterceptorLayer';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  createdAt: string;
  uploaderId: string;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    InterceptorLayer.fetch('/api/videos')
      .then((data) => {
        if (Array.isArray(data)) {
          setVideos(data);
        } else {
          setVideos([]);
          setError('Received invalid data format from server.');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch videos', err);
        setError(err.message || 'Failed to load videos. Please try again later.');
        setLoading(false);
      });
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse flex flex-col gap-2">
            <div className="bg-neutral-800 aspect-video rounded-xl w-full"></div>
            <div className="flex gap-3 mt-2">
              <div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0"></div>
              <div className="flex flex-col gap-2 w-full">
                <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center h-full">
        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-neutral-100 mb-2">Connection Error</h2>
        <p className="text-neutral-400 max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {['All', 'Gaming', 'Music', 'Live', 'News'].map((category) => (
          <button
            key={category}
            className="px-4 py-1.5 rounded-full bg-neutral-800 text-sm font-medium whitespace-nowrap hover:bg-neutral-700 transition-colors"
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {videos.map((video) => (
          <Link to={`/video/${video.id}`} key={video.id} className="group flex flex-col gap-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1 backdrop-blur-sm">
                <Clock className="w-3 h-3" />
                {formatDuration(video.duration)}
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-6 h-6 ml-1" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 shrink-0 flex items-center justify-center text-white font-bold">
                {video.title.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-neutral-100 line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-neutral-400 mt-1">{video.uploaderId}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(video.views)} views</span>
                  <span>•</span>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
