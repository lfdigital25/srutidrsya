const axios = require('axios');
const NodeCache = require('node-cache');

// simple in-memory cache for a few minutes
const cache = new NodeCache({ stdTTL: 300 });
const API = 'https://vid.puffyan.us/api/v1';

module.exports = {
  async search(query) {
    const key = `search_${query}`;
    if (cache.has(key)) return cache.get(key);
    const resp = await axios.get(`${API}/search?q=${encodeURIComponent(query)}&type=video`);
    cache.set(key, resp.data);
    return resp.data;
  },

  async video(id) {
    const key = `video_${id}`;
    if (cache.has(key)) return cache.get(key);
    const resp = await axios.get(`${API}/videos/${id}`);
    cache.set(key, resp.data);
    return resp.data;
  },

  async trending() {
    const key = 'trending';
    if (cache.has(key)) return cache.get(key);
    const resp = await axios.get(`${API}/trending`);
    cache.set(key, resp.data);
    return resp.data;
  }
};
