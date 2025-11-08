import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { SPORTS_CATEGORIES } from '../../lib/constants';
import { MdAdd, MdDelete, MdClose, MdTv, MdSports, MdCalendarToday, MdSchedule } from 'react-icons/md';

export default function StreamTypeManagement() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    sport: '',
    start_time: '',
    end_time: '',
  });

  const fetchTypes = async () => {
    try {
      setLoading(true);
      // fetch all columns to avoid assuming a specific column exists
      const { data, error } = await supabase
        .from('stream_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTypes(data || []);
    } catch (err) {
      console.error('Error fetching stream types:', err);
      alert(err.message || 'Failed to load stream types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting stream type:', formData);
      
      const { data, error } = await supabase
        .from('stream_types')
        .insert([formData])
        .select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      
      console.log('Stream type added:', data);
      alert('Stream type added successfully!');
      
      setShowAddModal(false);
      setFormData({
        title: '',
        slug: '',
        sport: '',
        start_time: '',
        end_time: '',
      });
      fetchTypes();
    } catch (error) {
      console.error('Error adding stream type:', error);
      let errorMsg = 'Failed to add stream type';
      
      if (error.code === '42P01') {
        errorMsg = 'Database tables not found. Please run SUPABASE_SETUP.md SQL';
      } else if (error.code === '23505') {
        errorMsg = 'A stream type with this slug already exists';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this stream type?')) return;

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('stream_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Stream type deleted successfully!');
      fetchTypes();
    } catch (error) {
      console.error('Error deleting stream type:', error);
      alert('Failed to delete stream type');
    } finally {
      setDeletingId(null);
    }
  };

  const getSportBadgeColor = (sport) => {
    const colors = {
      'Football': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Cricket': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Basketball': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Tennis': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[sport] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const filteredTypes = types.filter(type => {
    const displayName = type.name ?? type.title ?? type.label ?? type.type_name ?? '';
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = sportFilter === 'all' || type.sport === sportFilter;
    return matchesSearch && matchesSport;
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
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Stream Types</h1>
            <p className="mt-2 text-gray-400">Manage stream type templates for streamers</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MdAdd className="text-xl" />
            <span className="font-medium">Add Stream Type</span>
          </button>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <MdTv className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
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
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Sports</option>
            {SPORTS_CATEGORIES.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Stream Types</p>
            <p className="text-2xl font-bold text-white mt-1">{types.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Filtered Results</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{filteredTypes.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Sports Categories</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{SPORTS_CATEGORIES.length}</p>
          </div>
        </div>

        {/* Stream Types List */}
        <div className="space-y-4">
          {filteredTypes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No stream types found.</div>
          ) : (
            filteredTypes.map(t => {
              const displayName = t.name ?? t.title ?? t.label ?? t.type_name ?? `#${t.id}`;
              const sport = t.sport ?? '-';
              const startTime = t.start_time ? new Date(t.start_time).toLocaleString() : '-';
              const endTime = t.end_time ? new Date(t.end_time).toLocaleString() : '-';

              return (
                <div 
                  key={t.id} 
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <MdTv className="text-2xl text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{displayName}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getSportBadgeColor(sport)}`}>
                              <MdSports />
                              {sport}
                            </span>
                            {t.slug && (
                              <span className="text-xs text-gray-500">
                                /{t.slug}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-14">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MdSchedule className="text-green-400" />
                          <span className="text-xs">Start: {startTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MdSchedule className="text-red-400" />
                          <span className="text-xs">End: {endTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                      {t.created_at && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MdCalendarToday />
                          {new Date(t.created_at).toLocaleDateString()}
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MdDelete />
                        <span className="text-xs font-medium">
                          {deletingId === t.id ? 'Deleting...' : 'Delete'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add Stream Type</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Manchester United vs Liverpool"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="manchester-united-vs-liverpool"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated from title</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sport *
                  </label>
                  <select
                    name="sport"
                    value={formData.sport}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select sport</option>
                    {SPORTS_CATEGORIES.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Stream Type
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-700 text-gray-300 py-2.5 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
