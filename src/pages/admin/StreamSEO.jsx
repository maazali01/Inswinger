import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { MdSearch, MdClose, MdAutoAwesome, MdSave, MdCheckCircle, MdWarning } from 'react-icons/md';
import { useToast } from '../../components/ToastContainer';

export default function StreamSEO() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(null);
  const [saving, setSaving] = useState(null);
  const [seoData, setSeoData] = useState({});
  const [activeTab, setActiveTab] = useState('without-seo'); // 'without-seo' or 'with-seo'
  const toast = useToast();

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('streams')
        .select(`
          id,
          seo_title,
          seo_description,
          seo_keywords,
          stream_types(title, slug, sport)
        `)
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

  const generateSEO = async (streamId, slug, title, sport) => {
    if (!slug && !title) {
      toast.warning('Stream slug or title is required');
      return;
    }

    setGenerating(streamId);
    try {
      const response = await fetch('/.netlify/functions/generateSEO', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
          title,
          sport
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SEO');
      }

      const data = await response.json();
      
      setSeoData(prev => ({
        ...prev,
        [streamId]: {
          seo_title: data.title,
          seo_description: data.description,
          seo_keywords: data.keywords,
        }
      }));

      toast.success('SEO generated successfully! Click "Apply SEO" to save.');
    } catch (error) {
      console.error('Generate SEO error:', error);
      toast.error(error.message || 'Failed to generate SEO');
    } finally {
      setGenerating(null);
    }
  };

  const applySEO = async (streamId) => {
    const seo = seoData[streamId];
    if (!seo) {
      toast.warning('Please generate SEO first');
      return;
    }

    setSaving(streamId);
    try {
      const { error } = await supabase
        .from('streams')
        .update({
          seo_title: seo.seo_title,
          seo_description: seo.seo_description,
          seo_keywords: seo.seo_keywords,
        })
        .eq('id', streamId);

      if (error) throw error;

      toast.success('SEO applied successfully!');
      
      // Update local state
      setStreams(prev => prev.map(s => 
        s.id === streamId 
          ? { ...s, ...seo }
          : s
      ));
      
      // Clear temporary data and refresh
      setSeoData(prev => {
        const newData = { ...prev };
        delete newData[streamId];
        return newData;
      });

      // Switch to "With SEO" tab after applying
      setTimeout(() => {
        setActiveTab('with-seo');
      }, 1000);
    } catch (error) {
      console.error('Apply SEO error:', error);
      toast.error(error.message || 'Failed to apply SEO');
    } finally {
      setSaving(null);
    }
  };

  // Separate streams into two categories
  const streamsWithSEO = streams.filter(s => s.seo_title);
  const streamsWithoutSEO = streams.filter(s => !s.seo_title);

  const filteredStreamsWithSEO = streamsWithSEO.filter(stream => {
    const title = stream.stream_types?.title?.toLowerCase() || '';
    const slug = stream.stream_types?.slug?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return title.includes(search) || slug.includes(search);
  });

  const filteredStreamsWithoutSEO = streamsWithoutSEO.filter(stream => {
    const title = stream.stream_types?.title?.toLowerCase() || '';
    const slug = stream.stream_types?.slug?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return title.includes(search) || slug.includes(search);
  });

  if (loading) {
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
        <title>Stream SEO Management | Admin - Inswinger+</title>
        <meta name="description" content="Manage SEO metadata for streams using AI-powered generation" />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="flex-1 p-8 ml-64">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white">Stream SEO Management</h1>
            <p className="mt-2 text-gray-400">Generate and manage SEO metadata for streams using AI</p>
          </header>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search by stream title or slug..."
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

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total Streams</p>
              <p className="text-2xl font-bold text-white mt-1">{streams.length}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">With SEO</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{streamsWithSEO.length}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Without SEO</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{streamsWithoutSEO.length}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('without-seo')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'without-seo'
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MdWarning />
                <span>Without SEO ({streamsWithoutSEO.length})</span>
              </div>
              {activeTab === 'without-seo' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('with-seo')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'with-seo'
                  ? 'text-green-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MdCheckCircle />
                <span>With SEO ({streamsWithSEO.length})</span>
              </div>
              {activeTab === 'with-seo' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"></div>
              )}
            </button>
          </div>

          {/* Streams Without SEO */}
          {activeTab === 'without-seo' && (
            <div className="space-y-4">
              {filteredStreamsWithoutSEO.length === 0 ? (
                <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
                  <MdCheckCircle className="text-6xl text-green-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-xl">
                    {searchTerm ? 'No streams found matching your search' : 'All streams have SEO applied!'}
                  </p>
                </div>
              ) : (
                filteredStreamsWithoutSEO.map(stream => {
                  const hasGeneratedSEO = !!seoData[stream.id];
                  const currentSEO = seoData[stream.id];

                  return (
                    <div
                      key={stream.id}
                      className="bg-gray-800 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-200"
                    >
                      <div className="flex flex-col gap-4">
                        {/* Stream Info */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {stream.stream_types?.title || 'Untitled Stream'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="text-gray-400">
                                Slug: <span className="text-blue-400">/{stream.stream_types?.slug}</span>
                              </span>
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                                {stream.stream_types?.sport}
                              </span>
                              <span className="flex items-center gap-1 text-yellow-400 text-xs">
                                <MdWarning />
                                SEO Not Applied
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => generateSEO(
                                stream.id,
                                stream.stream_types?.slug,
                                stream.stream_types?.title,
                                stream.stream_types?.sport
                              )}
                              disabled={generating === stream.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <MdAutoAwesome className={generating === stream.id ? 'animate-spin' : ''} />
                              <span className="font-medium text-sm">
                                {generating === stream.id ? 'Generating...' : 'Generate SEO'}
                              </span>
                            </button>

                            {hasGeneratedSEO && (
                              <button
                                onClick={() => applySEO(stream.id)}
                                disabled={saving === stream.id}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <MdSave />
                                <span className="font-medium text-sm">
                                  {saving === stream.id ? 'Applying...' : 'Apply SEO'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* SEO Preview - Only show if generated */}
                        {hasGeneratedSEO && currentSEO && (
                          <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-green-500/30">
                            <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                              <MdAutoAwesome />
                              Generated SEO Preview
                            </h4>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Title</label>
                                <p className="text-sm text-white">{currentSEO.seo_title}</p>
                              </div>

                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Description</label>
                                <p className="text-sm text-gray-300">{currentSEO.seo_description}</p>
                              </div>

                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Keywords</label>
                                <p className="text-sm text-gray-400">{currentSEO.seo_keywords}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Streams With SEO */}
          {activeTab === 'with-seo' && (
            <div className="space-y-4">
              {filteredStreamsWithSEO.length === 0 ? (
                <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
                  <MdWarning className="text-6xl text-yellow-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-xl">
                    {searchTerm ? 'No streams found matching your search' : 'No streams with SEO yet'}
                  </p>
                </div>
              ) : (
                filteredStreamsWithSEO.map(stream => (
                  <div
                    key={stream.id}
                    className="bg-gray-800 border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all duration-200"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Stream Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {stream.stream_types?.title || 'Untitled Stream'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-gray-400">
                              Slug: <span className="text-blue-400">/{stream.stream_types?.slug}</span>
                            </span>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                              {stream.stream_types?.sport}
                            </span>
                            <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                              <MdCheckCircle />
                              SEO Applied
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current SEO Display */}
                      <div className="mt-2 p-4 bg-gray-900 rounded-lg border border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">Current SEO</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Title</label>
                            <p className="text-sm text-white">{stream.seo_title}</p>
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Description</label>
                            <p className="text-sm text-gray-300">{stream.seo_description}</p>
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Keywords</label>
                            <p className="text-sm text-gray-400">{stream.seo_keywords}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
