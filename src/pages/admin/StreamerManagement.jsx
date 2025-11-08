import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { MdVerified, MdPending, MdEmail, MdCalendarToday, MdClose, MdCheckCircle } from 'react-icons/md';

export default function StreamerManagement() {
  const [streamers, setStreamers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchStreamers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, is_verified, created_at')
        .eq('role', 'streamer')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStreamers(data || []);
    } catch (err) {
      console.error('Error fetching streamers:', err);
      alert(err.message || 'Failed to load streamers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamers();
  }, []);

  const handleApprove = async (id) => {
    if (!confirm('Approve this streamer?')) return;
    try {
      setApprovingId(id);
      const { error } = await supabase.from('users').update({ is_verified: true }).eq('id', id);
      if (error) throw error;
      alert('Streamer approved successfully!');
      await fetchStreamers();
    } catch (err) {
      console.error('Approve error:', err);
      alert(err.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const filteredStreamers = streamers.filter(streamer => {
    const matchesSearch = streamer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         streamer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'verified' && streamer.is_verified) ||
                         (statusFilter === 'pending' && !streamer.is_verified);
    return matchesSearch && matchesStatus;
  });

  const verifiedCount = streamers.filter(s => s.is_verified).length;
  const pendingCount = streamers.filter(s => !s.is_verified).length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Streamer Management</h1>
          <p className="mt-2 text-gray-400">Approve and manage streamers on the platform</p>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Streamers</p>
            <p className="text-2xl font-bold text-white mt-1">{streamers.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Verified</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{verifiedCount}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{pendingCount}</p>
          </div>
        </div>

        {/* Streamers List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : filteredStreamers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No streamers found.</div>
          ) : (
            filteredStreamers.map(s => (
              <div 
                key={s.id} 
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-lg">
                        {(s.name || s.email || 'S').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg">{s.name || 'No name'}</h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                        <MdEmail className="text-gray-500 flex-shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MdCalendarToday className="flex-shrink-0" />
                        Joined {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {s.is_verified ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                        <MdVerified className="text-lg" />
                        <span className="font-medium">Verified</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30">
                          <MdPending className="text-lg" />
                          <span className="font-medium">Pending</span>
                        </div>
                        <button 
                          onClick={() => handleApprove(s.id)}
                          disabled={approvingId === s.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MdCheckCircle className="text-lg" />
                          <span className="font-medium">
                            {approvingId === s.id ? 'Approving...' : 'Approve'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
