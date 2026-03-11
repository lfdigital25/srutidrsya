import { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InterceptorLayer } from '../services/InterceptorLayer';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(handler);
  }, [query]);

  // Fetch results when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery) {
      handleSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const data = await InterceptorLayer.fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(data);
    } catch (error) {
      console.error('Search failed', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto h-full flex flex-col">
      <div className="relative flex items-center mb-6">
        <div className="absolute left-4 text-neutral-400">
          <SearchIcon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="Search SRUTI DRSYA..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-3 pl-12 pr-12 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 transition-colors"
          autoFocus
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-neutral-500">Loading...</div>
      ) : results.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-4">
          {results.map((video) => (
            <Link to={`/video/${video.id}`} key={video.id} className="flex gap-4 group">
              <img src={video.thumbnailUrl} alt={video.title} className="w-40 aspect-video rounded-xl object-cover" />
              <div>
                <h3 className="text-neutral-100 font-semibold">{video.title}</h3>
                <p className="text-sm text-neutral-400 mt-1">{video.description}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : query ? (
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
          <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
          <p>No results found for "{query}"</p>
        </div>
      ) : null}
    </div>
  );
}
