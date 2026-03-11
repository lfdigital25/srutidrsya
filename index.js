const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// fallback search libraries
const youtubesearchapi = require("youtube-search-api");
const InvidiousService = require("./invidious-service.js");

const app = express();

// Security & CORS
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10kb' }));

// --- API Routes ---

// Get Trending Videos
app.get('/api/videos', async (req, res) => {
  try {
    const response = await fetch('https://pipedapi.kavin.rocks/trending?region=US');
    if (!response.ok) throw new Error('Piped API error');
    
    const data = await response.json();
    const videos = data.map((item) => ({
      id: item.url.replace('/watch?v=', ''),
      title: item.title,
      description: item.shortDescription || '',
      uploaderId: item.uploaderName,
      thumbnailUrl: item.thumbnail,
      duration: item.duration,
      views: item.views,
      likes: 0,
      createdAt: new Date(Date.now() - item.uploaded * 1000).toISOString(),
    })).slice(0, 20);

    return res.json(videos);
  } catch (error) {
    console.error('Primary trending fetch failed, fallback to youtube-search-api:', error);
    try {
      const yt = await youtubesearchapi.GetListByKeyword('trending', false, 20);
      const videos = (yt.items || [])
        .filter(i => i.type === 'video')
        .map(item => ({
          id: item.id || item.videoId || '',
          title: item.title || '',
          description: item.description || '',
          uploaderId: item.channelTitle || (item.channel && item.channel.name) || '',
          thumbnailUrl: item.thumbnail && item.thumbnail[0] ? item.thumbnail[0].url : '',
          duration: item.length || 0,
          views: item.views || 0,
          likes: 0,
          createdAt: item.publishedText || new Date().toISOString(),
        }));
      return res.json(videos);
    } catch (ytErr) {
      console.error('Trending fallback also failed:', ytErr);
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

// Get Single Video
app.get('/api/videos/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
    const pipedResponse = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
    if (!pipedResponse.ok) throw new Error('Piped API error');
    
    const pipedData = await pipedResponse.json();
    const videoData = {
      id: videoId,
      title: pipedData.title,
      description: pipedData.description,
      uploaderId: pipedData.uploader,
      thumbnailUrl: pipedData.thumbnailUrl,
      duration: pipedData.duration,
      views: pipedData.views,
      likes: pipedData.likes,
      createdAt: new Date().toISOString(),
      sponsorSegments: [],
      videoUrl: ''
    };

    if (pipedData.videoStreams?.length > 0) {
      const stream = pipedData.videoStreams.find((s) => s.videoOnly === false) || pipedData.videoStreams[0];
      videoData.videoUrl = stream.url;
    } else if (pipedData.hls) {
      videoData.videoUrl = pipedData.hls;
    }

    try {
      const sponsorResponse = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`);
      if (sponsorResponse.ok) {
        const sponsorData = await sponsorResponse.json();
        videoData.sponsorSegments = sponsorData.map((seg) => ({
          start: seg.segment[0],
          end: seg.segment[1],
          category: seg.category
        }));
      }
    } catch (e) { /* Ignore SponsorBlock errors */ }

    return res.json(videoData);
  } catch (error) {
    console.error('Primary video fetch failed, falling back to youtube-search-api:', error);
    try {
      const info = await youtubesearchapi.GetVideoDetails(videoId);
      if (!info || !info.id) throw new Error('YT details missing');
      const videoData = {
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
        relatedVideos: (info.suggestion || []).map((s) => ({
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
      // final Invidious attempt
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

// Search
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query parameter q is required' });

  try {
    const response = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=all`);
    if (!response.ok) throw new Error('Piped API error');
    
    const data = await response.json();
    const results = data.items.filter((item) => item.type === 'stream').map((item) => ({
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
    console.error('Primary search failed:', error);
    // fallback using youtube-search-api
    try {
      const yt = await youtubesearchapi.GetListByKeyword(query, false, 20);
      const items = (yt.items || [])
        .filter((i) => i.type === 'video')
        .map((item) => ({
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
      // try Invidious
      try {
        const inv = await InvidiousService.search(query);
        return res.json(inv);
      } catch (invErr) {
        console.error('Invidious search fallback failed:', invErr);
        return res.status(500).json({ error: 'Failed to search' });
      }
    }
  }
});

// Export for Vercel (Serverless Function)
module.exports = app;
// Attach for Firebase (Cloud Function) compatibility
module.exports.api = onRequest({}, app);