import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { SPORTS_CATEGORIES } from '../../lib/constants';
import { MdSearch, MdClose, MdVideoLibrary, MdLiveTv, MdPlayArrow, MdAccessTime } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

const UserDashboard = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          stream_types(*),
          users(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.stream_types?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stream.stream_types?.sport?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'live') return stream.is_live && matchesSearch;
    return stream.stream_types?.sport === activeFilter && matchesSearch;
  });

  const liveCount = streams.filter(s => s.is_live).length;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Live Sports Streams",
    "description": "Browse and watch live sports streaming events",
    "numberOfItems": streams.length,
    "itemListElement": streams.slice(0, 10).map((stream, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": stream.stream_types?.title || 'Sports Stream',
      "url": `${window.location.origin}/stream/${stream.id}`,
    })),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-100 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Live Sports Streams | Inswinger+ Dashboard"
        description={`Watch ${streams.length} live sports streams including football, cricket, basketball, and more. Stream your favorite sports events in HD quality.`}
        keywords="live sports, sports streaming, football live, cricket live, basketball streams, watch sports online"
        canonical="/home"
        schema={schema}
      />
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Live Streams</h1>
          
          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-white">Total Streams</p>
                <p className="text-3xl font-bold text-white">{streams.length}</p>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-white">Live Now</p>
                <p className="text-3xl font-bold text-red-400">{liveCount}</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search streams by title or sport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pl-12 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <MdClose />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveFilter('all')}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <MdVideoLibrary />
                All Streams
              </button>
              <button
                onClick={() => setActiveFilter('live')}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeFilter === 'live'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <MdLiveTv />
                Live Now {liveCount > 0 && `(${liveCount})`}
              </button>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">All Sports</option>
                {SPORTS_CATEGORIES.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Streams List */}
          {filteredStreams.length === 0 ? (
            <div className="text-center py-20">
              <MdVideoLibrary className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">
                {searchTerm || activeFilter !== 'all' ? 'No streams found matching your filters' : 'No streams available yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all cursor-pointer"
                  onClick={() => navigate(`/stream/${stream.id}`)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-lg ${stream.is_live ? 'bg-red-500/10' : 'bg-gray-700/50'}`}>
                        {stream.is_live ? (
                          <MdLiveTv className="text-2xl text-red-400" />
                        ) : (
                          <MdVideoLibrary className="text-2xl text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {stream.stream_types?.title || 'Untitled Stream'}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-400 flex-wrap">
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                            {stream.stream_types?.sport || 'Sport'}
                          </span>
                          <div className="flex items-center gap-1">
                            <MdAccessTime className="text-xs" />
                            <span className="text-xs">
                              {stream.stream_types?.start_time 
                                ? new Date(stream.stream_types.start_time).toLocaleString([], { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'Time TBA'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            Streamer: {stream.users?.name || 'Unknown'}
                          </span>
                          {stream.stream_url && (
                            <span className="text-xs text-gray-600">
                              • Source: {new URL(stream.stream_url).hostname}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        stream.is_live 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          stream.is_live 
                            ? 'bg-white animate-pulse' 
                            : 'bg-gray-400'
                        }`}></span>
                        {stream.is_live ? 'LIVE' : 'OFFLINE'}
                      </span>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <MdPlayArrow className="text-xl" />
                        <span className="font-medium">Watch</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
