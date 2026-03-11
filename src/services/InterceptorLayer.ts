const SERP_API_KEY = "47a4ee3c9f1efe3b74be5f2ee7882f5117b0d8e7abcc50c56172c14f75cec0d7";
const YOUTUBE_API_KEY = "AIzaSyAkMfQEtumDB8ih-bcOmU0MOWEDRXZBRvc";

export class InterceptorLayer {
  static cleanResponse(data: any) {
    console.log('🛡️ [Interceptor Layer] Inspecting incoming API response...');
    let cleaned = Array.isArray(data) ? [...data] : { ...data };

    // 1. Feed Ads Removal
    if (Array.isArray(cleaned)) {
      const originalLength = cleaned.length;
      // Filter out entries tagged as promoted or sponsored
      cleaned = cleaned.filter(item => !item.promotedVideo && !item.adSlots);
      if (originalLength !== cleaned.length) {
        console.log(`🛡️ [Interceptor Layer] Removed ${originalLength - cleaned.length} promoted videos/ads from feed.`);
      }
    }

    // 2. Player API Ad Removal
    if (!Array.isArray(cleaned)) {
      if (cleaned.playerAds || cleaned.adPlacements || cleaned.adSlots) {
        console.log('🛡️ [Interceptor Layer] Ad metadata detected. Removing playerAds, adPlacements, adSlots...');
        delete cleaned.playerAds;
        delete cleaned.adPlacements;
        delete cleaned.adSlots;
        delete cleaned.promotedVideo;
      }
    }

    return cleaned;
  }

  // toggle client-side proxy/fallback logic (defaults to false in production)
  private static get useClientApi(): boolean {
    // set VITE_USE_CLIENT_API=true in .env during development only
    return import.meta.env.VITE_USE_CLIENT_API === 'true';
  }

  static async fetch(url: string, options?: RequestInit) {
    const urlString = url.toString();
    const isApiCall = urlString.startsWith('/api/') || 
                      (urlString.startsWith('http') && new URL(urlString).pathname.startsWith('/api/'));

    // only intercept when explicitly enabled (dev mode)
    if (isApiCall && this.useClientApi) {
      try {
        return await this.handleClientSideApi(url, options);
      } catch (error) {
        console.warn('⚠️ Client-side API failed, falling back to network', error);
        // if the client-side logic fails we simply let the browser perform the normal fetch
      }
    }

    const response = await fetch(url, options);
    
    // Check if the response is HTML (e.g., AI Studio "Server Starting" page or Vite fallback)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of JSON. This likely means an API call was not intercepted correctly. URL:', url);
      const text = await response.text();
      throw new Error('Server is starting or route not found. Please wait a moment and try again.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Pass through the interceptor layer before returning to the app
    return this.cleanResponse(data);
  }

  // Simulates the backend logic purely in the browser
  static async handleClientSideApi(url: string, options: any) {
    const path = new URL(url, window.location.origin).pathname;

    try {
      // 1. Trending Videos
      if (path === '/api/videos') {
        const response = await fetch('https://pipedapi.kavin.rocks/trending?region=US');
        if (!response.ok) throw new Error('Failed to fetch from Piped API');
        const data = await response.json();
        
        const videos = data.map((item: any) => ({
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
        
        return this.cleanResponse(videos);
      }

      // 2. Search
      if (path === '/api/search') {
        const urlObj = new URL(url, window.location.origin);
        const query = urlObj.searchParams.get('q');
        if (!query) throw new Error('Query parameter q is required');

        const response = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=all`);
        if (!response.ok) throw new Error('Failed to fetch from Piped API');
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
        
        return this.cleanResponse(results);
      }

      // 3. Single Video Details
      if (path.startsWith('/api/videos/')) {
        const videoId = path.split('/')[3];
        const pipedResponse = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
        if (!pipedResponse.ok) throw new Error('Video not found');
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
          createdAt: new Date().toISOString(),
          sponsorSegments: [],
          videoUrl: '',
          relatedVideos: [] // synchronized playlist field
        };

        if (pipedData.videoStreams?.length > 0) {
          const stream = pipedData.videoStreams.find((s: any) => s.videoOnly === false) || pipedData.videoStreams[0];
          videoData.videoUrl = stream.url;
        } else if (pipedData.hls) {
          videoData.videoUrl = pipedData.hls;
        }

        // Synchronize Playlist/Related Videos from Piped
        if (pipedData.relatedStreams) {
          videoData.relatedVideos = pipedData.relatedStreams.slice(0, 15).map((item: any) => ({
            id: item.url.replace('/watch?v=', ''),
            title: item.title,
            uploaderId: item.uploaderName,
            thumbnailUrl: item.thumbnail,
            duration: item.duration,
            views: item.views,
            createdAt: new Date(Date.now() - (item.uploaded || 0) * 1000).toISOString(),
          }));
        }

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
        } catch (e) { /* Ignore */ }

        return this.cleanResponse(videoData);
      }

    } catch (error) {
      console.error('Client-Side API Error:', error);
      throw error;
    }
  }

  // SerpApi fallback is no longer used; client-side API proxy is disabled by
  // default and we do not want any "mock" data in production.  Keep a stub
  // around so existing imports don’t break, but it immediately throws.
  static async handleSerpApiFallback(url: string, options: any) {
    throw new Error('Client-side SerpApi fallback disabled');
  }

  // Youtube Data API fallback also removed – stub only
  static async handleYoutubeApiFallback(url: string, options: any) {
    throw new Error('Client-side YouTube API fallback disabled');
  }
}
