import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { MdTv, MdDelete, MdPerson, MdLink, MdArrowBack, MdSearch, MdClose, MdSports, MdCalendarToday } from 'react-icons/md';
import { useToast } from '../../components/ToastContainer';
import ConfirmModal from '../../components/ConfirmModal';

export default function StreamManagement() {
  const [streamTypes, setStreamTypes] = useState([]);
  const [streams, setStreams] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchStreamTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchStreams(selectedType.id);
    }
  }, [selectedType]);

  const fetchStreamTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stream_types')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStreamTypes(data || []);
    } catch (err) {
      console.error('Error fetching stream types:', err);
      toast.error(err.message || 'Failed to load stream types');
    } finally {
      setLoading(false);
    }
  };

  const fetchStreams = async (typeId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          users(name, email),
          stream_types(title, sport)
        `)
        .eq('stream_type_id', typeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStreams(data || []);
    } catch (err) {
      console.error('Error fetching streams:', err);
      toast.error(err.message || 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStream = async (streamId) => {
    setConfirmDelete(streamId);
  };

  const confirmDeleteStream = async () => {
    if (!confirmDelete) return;
    
    try {
      setDeletingId(confirmDelete);
      const { error } = await supabase.from('streams').delete().eq('id', confirmDelete);
      if (error) throw error;
      toast.success('Stream deleted successfully!');
      fetchStreams(selectedType.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete stream error:', err);
      toast.error(err.message || 'Failed to delete stream');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStreamTypes = streamTypes.filter(type => {
    const title = type.title?.toLowerCase() || '';
    const sport = type.sport?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return title.includes(search) || sport.includes(search);
  });

  const filteredStreams = streams.filter(stream => {
    const streamerName = stream.users?.name?.toLowerCase() || '';
    const streamerEmail = stream.users?.email?.toLowerCase() || '';
    const link = stream.stream_link?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return streamerName.includes(search) || streamerEmail.includes(search) || link.includes(search);
  });

  if (loading && streamTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 ml-64 flex items-center justify-center">
          <div className="text-gray-100 text-xl">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Stream Management | Admin - Inswinger+</title>
        <meta name="description" content="Manage stream types and streams uploaded by streamers" />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="flex-1 p-8 md:ml-64">
          {/* Header */}
          <header className="mb-8">
            {selectedType ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedType(null);
                    setStreams([]);
                    setSearchTerm('');
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <MdArrowBack className="text-2xl text-gray-400 hover:text-white" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white">{selectedType.title}</h1>
                  <p className="mt-2 text-gray-400">
                    Streams uploaded by streamers for {selectedType.sport}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-white">Stream Management</h1>
                <p className="mt-2 text-gray-400">View stream types and manage streams</p>
              </div>
            )}
          </header>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder={selectedType ? "Search by streamer or link..." : "Search stream types..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <MdClose />
                </button>
              )}
            </div>
          </div>

          {/* Stream Types View */}
          {!selectedType && (
            <>
              {/* Stats */}
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Total Stream Types</p>
                  <p className="text-2xl font-bold text-white mt-1">{streamTypes.length}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Filtered Results</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{filteredStreamTypes.length}</p>
                </div>
              </div>

              {/* Stream Types Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStreamTypes.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    No stream types found.
                  </div>
                ) : (
                  filteredStreamTypes.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setSelectedType(type)}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                          <MdTv className="text-3xl text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {type.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                              <MdSports className="inline mr-1" />
                              {type.sport}
                            </span>
                          </div>
                          {type.start_time && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <MdCalendarToday />
                              {new Date(type.start_time).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Streams View */}
          {selectedType && (
            <>
              {/* Stats */}
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Total Streams</p>
                  <p className="text-2xl font-bold text-white mt-1">{streams.length}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Filtered Results</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{filteredStreams.length}</p>
                </div>
              </div>

              {/* Streams List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-gray-400">Loading streams...</div>
                ) : filteredStreams.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
                    <MdTv className="text-6xl text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-xl">
                      {searchTerm ? 'No streams found matching your search' : 'No streams uploaded yet for this type'}
                    </p>
                  </div>
                ) : (
                  filteredStreams.map(stream => (
                    <div
                      key={stream.id}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <MdPerson className="text-2xl text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white">
                                {stream.users?.name || 'Unknown Streamer'}
                              </h3>
                              <p className="text-sm text-gray-400">{stream.users?.email}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="text-xs text-gray-500">
                                  Ads: {stream.number_of_ads || 0}
                                </span>
                                {stream.adult_ads && (
                                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                    Adult Ads
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <MdCalendarToday />
                                  {new Date(stream.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {stream.stream_link && (
                            <div className="flex items-center gap-2 mt-3 p-3 bg-gray-900 rounded-lg">
                              <MdLink className="text-gray-500 flex-shrink-0" />
                              <a
                                href={stream.stream_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 truncate flex-1"
                              >
                                {stream.stream_link}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {stream.stream_link && (
                            <a
                              href={stream.stream_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <MdLink />
                              <span className="font-medium text-sm">View Stream</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteStream(stream.id)}
                            disabled={deletingId === stream.id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MdDelete />
                            <span className="font-medium text-sm">
                              {deletingId === stream.id ? 'Deleting...' : 'Delete'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteStream}
        title="Delete Stream"
        message="Are you sure you want to delete this stream? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        loading={!!deletingId}
      />
    </>
  );
}
