import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Maximize, ThumbsUp, ThumbsDown, Share2, MessageSquare, Volume1, Heart, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { InterceptorLayer } from '../services/InterceptorLayer';

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  likes: number;
  dislikes: number;
  sponsorSegments: { start: number; end: number }[];
  createdAt: string;
  uploaderId: string;
}

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Custom Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // TTS State
  const [sponsorToast, setSponsorToast] = useState<string | null>(null);

  useEffect(() => {
    InterceptorLayer.fetch(`/api/videos/${id}`)
      .then((data) => {
        if (data && !data.error) {
          setVideo(data);
          // Save to watch history
          import('../services/HistoryService').then(({ HistoryService }) => {
            HistoryService.addToHistory(data);
          });
        } else {
          setError(data?.error || 'Failed to load video.');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch video', err);
        setError(err.message || 'Failed to load video. Please try again later.');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(vid.currentTime);
      setProgress((vid.currentTime / vid.duration) * 100);

      // SponsorBlock Logic
      if (video.sponsorSegments && video.sponsorSegments.length > 0) {
        for (const segment of video.sponsorSegments) {
          if (vid.currentTime >= segment.start && vid.currentTime < segment.end) {
            console.log(`[SponsorBlock] Skipping sponsor segment: ${segment.start} - ${segment.end}`);
            vid.currentTime = segment.end;
            setSponsorToast('SponsorBlock: Skipped sponsor segment');
            setTimeout(() => setSponsorToast(null), 3000);
          }
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(vid.duration);
    };

    const handleVisibilityChange = () => {
      const isBackgroundPlayEnabled = localStorage.getItem('backgroundPlay') === 'true';
      if (document.hidden && !isBackgroundPlayEnabled && !vid.paused) {
        vid.pause();
      }
    };

    vid.addEventListener('timeupdate', handleTimeUpdate);
    vid.addEventListener('loadedmetadata', handleLoadedMetadata);
    vid.addEventListener('play', () => setIsPlaying(true));
    vid.addEventListener('pause', () => setIsPlaying(false));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      vid.removeEventListener('timeupdate', handleTimeUpdate);
      vid.removeEventListener('loadedmetadata', handleLoadedMetadata);
      vid.removeEventListener('play', () => setIsPlaying(true));
      vid.removeEventListener('pause', () => setIsPlaying(false));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [video]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(Number(e.target.value));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-red-600">Loading video...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ShieldCheck className="w-12 h-12 text-red-500 mb-4" />
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

  if (!video) {
    return <div className="flex items-center justify-center h-full text-red-500">Video not found</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-y-auto bg-neutral-950">
      {/* Main Content */}
      <div className="flex-1 lg:max-w-[70%] xl:max-w-[75%] p-0 lg:p-4">
        {/* Video Player Container */}
        <div 
          ref={playerContainerRef}
          className="relative w-full bg-black aspect-video group"
          onDoubleClick={toggleFullscreen}
        >
          {/* SponsorBlock Toast */}
          {sponsorToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-full font-medium text-sm shadow-lg z-50 animate-bounce flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {sponsorToast}
            </div>
          )}
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            className="w-full h-full object-contain"
            playsInline
            onClick={togglePlay}
          />
          
          {/* Custom Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
            
            {/* Progress Bar */}
            <div className="relative w-full h-1 bg-neutral-600 rounded cursor-pointer group/progress">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="absolute top-0 left-0 h-full bg-red-600 rounded pointer-events-none"
                style={{ width: `${progress}%` }}
              />
              {/* Sponsor Segments Markers */}
              {video.sponsorSegments?.map((seg, i) => {
                const startPercent = (seg.start / duration) * 100;
                const widthPercent = ((seg.end - seg.start) / duration) * 100;
                return (
                  <div 
                    key={i}
                    className="absolute top-0 h-full bg-yellow-500/80 pointer-events-none"
                    style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                    title="Sponsor Segment (Auto-skip)"
                  />
                );
              })}
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="hover:text-red-500 transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                </button>
                
                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="hover:text-red-500 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 opacity-0 group-hover/volume:opacity-100 accent-red-600"
                  />
                </div>

                <div className="text-sm font-medium font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={toggleFullscreen} className="hover:text-red-500 transition-colors">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-100">{video.title}</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl">
                {video.uploaderId ? video.uploaderId.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200">{video.uploaderId}</h3>
                <p className="text-sm text-neutral-400">YouTube Channel</p>
              </div>
              <button className="ml-4 px-4 py-2 bg-neutral-100 text-neutral-900 font-semibold rounded-full hover:bg-neutral-300 transition-colors">
                Subscribe
              </button>
              <button className="ml-2 px-4 py-2 bg-neutral-800 text-neutral-200 font-semibold rounded-full hover:bg-neutral-700 transition-colors flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" /> Donate
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <div className="flex items-center bg-neutral-800 rounded-full">
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-700 rounded-l-full transition-colors border-r border-neutral-700">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{video.likes || '12K'}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-700 rounded-r-full transition-colors">
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors whitespace-nowrap">
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>

          {/* Description Box */}
          <div className="mt-6 bg-neutral-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2 text-sm font-semibold text-neutral-300">
                <span>{video.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {video.description}
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar / Related Videos */}
      <div className="flex-1 lg:max-w-[30%] xl:max-w-[25%] p-4 lg:pl-0">
        <h3 className="font-semibold text-lg mb-4 text-neutral-200">Up Next</h3>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Link to={`/video/v${(i % 3) + 1}`} key={i} className="flex gap-2 group">
              <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                <img 
                  src={`https://picsum.photos/seed/${i}/320/180`} 
                  alt="Thumbnail" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-medium">
                  10:24
                </div>
              </div>
              <div className="flex flex-col py-1">
                <h4 className="text-sm font-semibold text-neutral-200 line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                  Understanding Treatment Options and Recovery
                </h4>
                <p className="text-xs text-neutral-400 mt-1">SRUTI DRSYA Official</p>
                <p className="text-xs text-neutral-500">24K views • 1 day ago</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
