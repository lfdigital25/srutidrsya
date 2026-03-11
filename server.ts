import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// fallback library for when pipedapi is unreachable or CORS issues
import youtubesearchapi from 'youtube-search-api';
import InvidiousService from './invidious-service.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite dev server compatibility
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: true }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/api/', apiLimiter);
app.use(express.json({ limit: '10kb' })); 

// ... (API Routes remain strictly same, skipping for brevity of diff) ...

// Get Trending Videos (Feed)
app.get('/api/videos', async (req, res) => {
    try {
      // Use Piped API for trending videos to avoid YouTube API key requirement
      const response = await fetch('https://pipedapi.kavin.rocks/trending?region=US');
      
      if (!response.ok) {
        throw new Error('Piped API error');
      }
      
      const data = await response.json();

      const videos = data.map((item: any) => {
        return {
          id: item.url.replace('/watch?v=', ''),
          title: item.title,
          description: item.shortDescription || '',
          uploaderId: item.uploaderName,
          thumbnailUrl: item.thumbnail,
          duration: item.duration,
          views: item.views,
          likes: 0, // Piped trending doesn't return likes
          createdAt: new Date(Date.now() - item.uploaded * 1000).toISOString(), // rough estimate if uploaded is in ms ago, actually piped returns uploadedDate string sometimes, let's just use uploadedDate
        };
      }).slice(0, 20); // Limit to 20

      return res.json(videos);
    } catch (error) {
      console.error('Primary trending fetch failed, attempting fallback search API:', error);
      try {
        const yt = await youtubesearchapi.GetListByKeyword('trending', false, 20);
        const items = (yt.items || [])
          .filter((i: any) => i.type === 'video')
          .map((item: any) => ({
            id: item.id || item.videoId || '',
            title: item.title || '',
            description: item.description || '',
            uploaderId: item.channelTitle || (item.channel && item.channel.name) || '',
            thumbnailUrl: item.thumbnail && item.thumbnail[0] ? item.thumbnail[0].url : '',
            duration: item.length || 0,
            views: item.views || 0,
            createdAt: item.publishedText || new Date().toISOString(),
          }));
        return res.json(items);
      } catch (ytError) {
        console.error('Trending fallback also failed:', ytError);
        // final fallback to Invidious
        try {
          const invData = await InvidiousService.trending();
          return res.json(invData);
        } catch (invErr) {
          console.error('Invidious trending fallback failed:', invErr);
          return res.status(500).json({ error: 'Failed to fetch videos' });
        }
      }
    }
  });

  // Get Single Video Details, Stream URL (Piped API), and SponsorBlock segments
  app.get('/api/videos/:id', async (req, res) => {
    const videoId = req.params.id;
    try {
      // 1. Fetch Metadata and Stream URL from Piped API
      const pipedResponse = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
      if (!pipedResponse.ok) {
        throw new Error('Piped API returned non-ok');
      }
      
      const pipedData = await pipedResponse.json();

      const videoData: any = {
        id: videoId,
        title: pipedData.title,
        description: pipedData.description,
        uploaderId: pipedData.uploader,
        thumbnailUrl: pipedData.thumbnailUrl,
        duration: pipedData.duration,
        views: pipedData.views,
        likes: pipedData.likes,
        createdAt: new Date().toISOString(), // Piped doesn't always return exact date in stream endpoint
        sponsorSegments: [],
        videoUrl: ''
      };

      // Prefer native video streams (mp4/webm) over HLS for native <video> tag support
      if (pipedData.videoStreams && pipedData.videoStreams.length > 0) {
        // Find a stream with video and audio, or just the highest quality video stream
        const stream = pipedData.videoStreams.find((s: any) => s.videoOnly === false) || pipedData.videoStreams[0];
        videoData.videoUrl = stream.url;
      } else if (pipedData.hls) {
        videoData.videoUrl = pipedData.hls;
      }

      // 2. Fetch SponsorBlock Segments
      try {
        const sponsorResponse = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`);
        if (sponsorResponse.ok) {
          const sponsorData = await sponsorResponse.json();
          videoData.sponsorSegments = sponsorData.map((seg: any) => ({
            start: seg.segment[0],
            end: seg.segment[1],
            category: seg.category
          }));
        }
      } catch (sponsorError) {
        console.error('SponsorBlock API error:', sponsorError);
        // It's okay if SponsorBlock fails, just return empty segments
      }

      return res.json(videoData);
    } catch (error) {
      console.error('Primary video fetch failed, trying youtube-search-api details:', error);
      try {
        const info: any = await youtubesearchapi.GetVideoDetails(videoId);
        if (!info || !info.id) throw new Error('YT details missing');
        const videoData: any = {
          id: info.id,
          title: info.title,
          description: info.description,
          uploaderId: info.channel || '',
          thumbnailUrl: info.thumbnail?.[0]?.url || '',
          duration: 0,
          views: 0,
          likes: 0,
          createdAt: new Date().toISOString(),
          sponsorSegments: [],
          videoUrl: '',
          relatedVideos: (info.suggestion || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            uploaderId: s.channelTitle || '',
            thumbnailUrl: s.thumbnail?.[0]?.url || '',
            duration: 0,
            views: 0,
            createdAt: new Date().toISOString(),
          })),
        };
        return res.json(videoData);
      } catch (ytErr) {
        console.error('Fallback video details also failed:', ytErr);
        // try Invidious
        try {
          const inv = await InvidiousService.video(videoId);
          return res.json(inv);
        } catch (invErr) {
          console.error('Invidious video fallback failed:', invErr);
          return res.status(500).json({ error: 'Failed to fetch video' });
        }
      }
    }
  });

  // Search Videos
  app.get('/api/search', async (req, res) => {
    const query = req.query.q as string;
    console.log('[server] /api/search called with q=', query);
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    try {
      const response = await fetch(
        `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=all`
      );
      
      if (!response.ok) {
        throw new Error('Piped API error');
      }
      
      const data = await response.json();
      
      const results = data.items.filter((item: any) => item.type === 'stream').map((item: any) => ({
        id: item.url.replace('/watch?v=', ''),
        title: item.title,
        description: item.shortDescription || '',
        uploaderId: item.uploaderName,
        thumbnailUrl: item.thumbnail,
        duration: item.duration,
        views: item.views,
        createdAt: new Date(Date.now() - item.uploaded * 1000).toISOString(),
      }));
      
      return res.json(results);
    } catch (error) {
      console.error('Primary search failed, falling back to youtube-search-api:', error);
      try {
        const yt = await youtubesearchapi.GetListByKeyword(query, false, 20);
        const items = (yt.items || [])
          .filter((i: any) => i.type === 'video')
          .map((item: any) => ({
            id: item.id || item.videoId || '',
            title: item.title || '',
            description: item.description || '',
            uploaderId: item.channelTitle || (item.channel && item.channel.name) || '',
            thumbnailUrl: item.thumbnail && item.thumbnail[0] ? item.thumbnail[0].url : '',
            duration: item.length || 0,
            views: item.views || 0,
            createdAt: item.publishedText || new Date().toISOString(),
          }));
        return res.json(items);
      } catch (ytError) {
        console.error('youtube-search-api fallback also failed:', ytError);
        // final fallback to Invidious
        try {
          const inv = await InvidiousService.search(query);
          // Invidious returns raw items array
          return res.json(inv);
        } catch (invErr) {
          console.error('Invidious fallback failed:', invErr);
          return res.status(500).json({ error: 'Failed to search' });
        }
      }
    }
});

// Logic to run server ONLY if NOT in Vercel environment
if (!process.env.VERCEL) {
  const startLocalServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  };
  
  startLocalServer();
}

// Export app for Vercel
export default app;
