import { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AddStreamModal from './AddStreamModal';
import {
  MdSearch,
  MdClose,
  MdLiveTv,
  MdLink,
  MdContentCopy,
  MdDelete,
  MdCalendarToday,
  MdSports,
  MdTimer,
} from 'react-icons/md';
import { generateStreamUrl } from '../../lib/utils';
import { PLAN_INFO } from '../../lib/constants';

const StreamerDashboard = () => {
  const { user, profile } = useAuth();
  const [streams, setStreams] = useState([]);
  const [streamTypes, setStreamTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // UI / filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | live | scheduled | offline
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchStreams();
    fetchStreamTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          stream_types(*)
        `)
        .eq('streamer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_types')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      setStreamTypes(data || []);
    } catch (error) {
      console.error('Error fetching stream types:', error);
    }
  };

  const isStreamLive = useCallback((s) => {
    if (typeof s.is_live === 'boolean') return s.is_live;
    const start = s.stream_types?.start_time ? new Date(s.stream_types.start_time) : null;
    const end = s.stream_types?.end_time ? new Date(s.stream_types.end_time) : null;
    const now = new Date();
    if (start && end) return now >= start && now <= end;
    if (start) return now >= start;
    return false;
  }, []);

  const streamStatus = useCallback((s) => {
    if (isStreamLive(s)) return 'live';
    const start = s.stream_types?.start_time ? new Date(s.stream_types.start_time) : null;
    if (start && start > new Date()) return 'scheduled';
    return 'offline';
  }, [isStreamLive]);

  const uniqueSports = useMemo(() => {
    const set = new Set();
    streams.forEach((s) => {
      const sp = s.stream_types?.sport;
      if (sp) set.add(sp);
    });
    return Array.from(set).sort();
  }, [streams]);

  const filteredStreams = useMemo(() => {
    return streams.filter((s) => {
      const title = s.stream_types?.title || '';
      const sport = s.stream_types?.sport || '';
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.stream_link || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = sportFilter === 'all' || sport === sportFilter;
      const status = streamStatus(s);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesSport && matchesStatus;
    });
  }, [streams, searchTerm, sportFilter, statusFilter, streamStatus]);

  const handleDelete = async (streamId) => {
    if (!confirm('Are you sure you want to delete this stream?')) return;
    try {
      setDeletingId(streamId);
      const { error } = await supabase.from('streams').delete().eq('id', streamId);
      if (error) throw error;
      setStreams((prev) => prev.filter((p) => p.id !== streamId));
    } catch (error) {
      console.error('Error deleting stream:', error);
      alert('Failed to delete stream');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard');
    } catch {
      alert('Failed to copy link');
    }
  };

  // simple skeletons
  const SkeletonRow = () => (
    <div className="animate-pulse bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="h-5 bg-gray-700 rounded w-1/3 mb-3" />
          <div className="h-3 bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-1/2" />
        </div>
        <div className="w-40 flex items-center gap-2">
          <div className="h-8 bg-gray-700 rounded w-24" />
          <div className="h-8 bg-gray-700 rounded w-12" />
        </div>
      </div>
    </div>
  );

  const streamerPlan = profile?.plan;
  const planInfo = PLAN_INFO[streamerPlan];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Stream Management</h1>
                {planInfo && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg ${planInfo.bgColor} ${planInfo.textColor} border ${planInfo.borderColor} text-sm font-semibold`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {planInfo.name} Plan
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">Manage your streams and links</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add New Stream
              </button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Streams</p>
              <p className="text-2xl font-bold text-white">{streams.length}</p>
            </div>
            <MdLink className="text-3xl text-blue-400" />
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Live</p>
              <p className="text-2xl font-bold text-red-400">{streams.filter((s) => streamStatus(s) === 'live').length}</p>
            </div>
            <MdLiveTv className="text-3xl text-red-400" />
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Scheduled</p>
              <p className="text-2xl font-bold text-green-400">{streams.filter((s) => streamStatus(s) === 'scheduled').length}</p>
            </div>
            <MdTimer className="text-3xl text-green-400" />
          </div>
        </section>

        {/* Search & Filters */}
        <section className="mb-6 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 max-w-2xl">
            <input
              type="text"
              placeholder="Search by title or link..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pl-12 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <MdClose />
              </button>
            )}
          </div>

          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Sports</option>
            {uniqueSports.map((sp) => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="live">Live</option>
            <option value="scheduled">Scheduled</option>
            <option value="offline">Offline</option>
          </select>
        </section>

        {/* Streams List */}
        <section>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : filteredStreams.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <p className="text-gray-400">No streams found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStreams.map((stream) => {
                const status = streamStatus(stream);
                const start = stream.stream_types?.start_time ? new Date(stream.stream_types.start_time) : null;
                const end = stream.stream_types?.end_time ? new Date(stream.stream_types.end_time) : null;
                const fullStreamUrl = generateStreamUrl(stream.stream_types?.title, profile?.name);
                
                return (
                  <div key={stream.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${status === 'live' ? 'bg-red-500/10' : 'bg-gray-700/50'}`}>
                          {status === 'live' ? <MdLiveTv className="text-2xl text-red-400" /> : <MdLink className="text-2xl text-gray-400" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate">{stream.stream_types?.title || 'Untitled'}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-400">
                            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              <MdSports />
                              {stream.stream_types?.sport || 'Sport'}
                            </span>
                            {start && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <MdCalendarToday />
                                {start.toLocaleString()}
                                {end && ` — ${end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">• {stream.number_of_ads ?? 0} ads</span>
                            <span className="text-xs text-gray-500">• {stream.adult_ads ? 'Adult ads' : 'No adult ads'}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 truncate">{stream.stream_link || 'No link provided'}</p>
                          <span className="text-xs text-gray-500 font-mono">
                            URL: {fullStreamUrl}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status === 'live' ? 'bg-red-600 text-white' : status === 'scheduled' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                        <span className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                        {status === 'live' ? 'LIVE' : status === 'scheduled' ? 'SCHEDULED' : 'OFFLINE'}
                      </span>

                      {stream.stream_link && (
                        <>
                          <a href={stream.stream_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            View
                          </a>
                          <button onClick={() => copyToClipboard(stream.stream_link)} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600">
                            <MdContentCopy />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(stream.id)}
                        disabled={deletingId === stream.id}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <MdDelete />
                        <span className="text-xs">{deletingId === stream.id ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {showAddModal && (
          <AddStreamModal
            streamTypes={streamTypes}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchStreams();
            }}
          />
        )}
      </main>
    </div>
  );
};

export default StreamerDashboard;
