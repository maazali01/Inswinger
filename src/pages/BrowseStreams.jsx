import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SPORTS_CATEGORIES } from '../lib/constants';
import { MdSearch, MdClose, MdVideoLibrary, MdLiveTv, MdPlayArrow, MdAccessTime } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { generateStreamUrl } from '../lib/utils';
import { SEO_METADATA } from '../lib/seo';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';

const BrowseStreams = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

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
          users(name, plan)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Show ALL streams but sort by priority: live first, then by plan tier
      const sortedStreams = (data || []).sort((a, b) => {
        // First by live status
        if (a.is_live !== b.is_live) {
          return a.is_live ? -1 : 1;
        }
        // Then by plan priority (professional > premium > basic)
        const planPriority = { professional: 3, premium: 2, basic: 1 };
        const aPriority = planPriority[a.users?.plan] || 0;
        const bPriority = planPriority[b.users?.plan] || 0;
        if (bPriority !== aPriority) {
          return bPriority - aPriority;
        }
        // Finally by creation date
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      setStreams(sortedStreams);
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
        title="Browse Free Streams | Inswinger+"
        description="Browse all free sports streams on Inswinger+. Watch football, cricket, basketball, and more!"
        keywords="free sports streams, watch sports free, live sports, sports streaming"
        canonical="/browse"
      />
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Free Streams</h1>
              <p className="text-gray-400 text-sm mt-1">Watch basic tier streams for free</p>
            </div>

          </div>
          
          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-white">Total Free Streams</p>
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
              {filteredStreams.map((stream) => {
                const isPremium = stream.users?.plan === 'premium' || stream.users?.plan === 'professional';
                const isLocked = isPremium && !user;
                
                return (
                  <div
                    key={stream.id}
                    className={`bg-gray-800 border rounded-lg p-4 sm:p-5 transition-all ${
                      isLocked 
                        ? 'border-yellow-500/30 cursor-not-allowed opacity-75' 
                        : 'border-gray-700 hover:border-blue-500 cursor-pointer'
                    }`}
                    onClick={() => !isLocked && navigate(generateStreamUrl(stream.stream_types?.title, stream.users?.name))}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-lg relative ${
                          stream.is_live ? 'bg-red-500/10' : 'bg-gray-700/50'
                        }`}>
                          {stream.is_live ? (
                            <MdLiveTv className="text-2xl text-red-400" />
                          ) : (
                            <MdVideoLibrary className="text-2xl text-gray-400" />
                          )}
                          {isLocked && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {stream.stream_types?.title || 'Untitled Stream'}
                            </h3>
                            {isLocked && (
                              <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                              {stream.stream_types?.sport || 'Sport'}
                            </span>
                            
                            {/* Plan Badge */}
                            {stream.users?.plan === 'professional' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-500 text-black">
                                ⭐ PRO
                              </span>
                            )}
                            {stream.users?.plan === 'premium' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-500 text-white">
                                💎 PREMIUM
                              </span>
                            )}
                            {stream.users?.plan === 'basic' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-500 text-white">
                                FREE
                              </span>
                            )}
                            
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
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
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
                        {isLocked ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/login');
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors w-full sm:w-auto font-semibold"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Sign In to Watch</span>
                          </button>
                        ) : (
                          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto">
                            <MdPlayArrow className="text-xl" />
                            <span className="font-medium">Watch Free</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BrowseStreams;
