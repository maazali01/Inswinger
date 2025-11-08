import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { MdCheckCircle, MdCancel, MdImage, MdEmail, MdCalendarToday, MdClose, MdPending, MdVerified } from 'react-icons/md';

export default function Verifications() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      // Get all streamers with their verification status and screenshot
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, is_verified, screenshot_url, plan, created_at')
        .eq('role', 'streamer')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVerifications(data || []);
    } catch (err) {
      console.error('Error fetching verifications:', err);
      alert(err.message || 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleApprove = async (id) => {
    if (!confirm('Approve this streamer?')) return;
    
    try {
      setApproving(id);
      const { error } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', id);
      
      if (error) throw error;
      
      alert('Streamer approved successfully!');
      await fetchVerifications();
    } catch (err) {
      console.error('Approve error:', err);
      alert(err.message || 'Failed to approve streamer');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this verification? This will keep the streamer unverified.')) return;
    
    try {
      setApproving(id);
      // Optionally clear screenshot_url or just leave is_verified as false
      const { error } = await supabase
        .from('users')
        .update({ is_verified: false })
        .eq('id', id);
      
      if (error) throw error;
      
      alert('Verification rejected.');
      await fetchVerifications();
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.message || 'Failed to reject verification');
    } finally {
      setApproving(null);
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'verified' && verification.is_verified) ||
                         (statusFilter === 'pending' && !verification.is_verified);
    return matchesSearch && matchesStatus;
  });

  const verifiedCount = verifications.filter(v => v.is_verified).length;
  const pendingCount = verifications.filter(v => !v.is_verified).length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="p-8 ml-64">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Payment Verifications</h1>
          <p className="mt-2 text-gray-400">Review and approve payment screenshots from streamers</p>
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
            <p className="text-sm text-gray-400">Total Submissions</p>
            <p className="text-2xl font-bold text-white mt-1">{verifications.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Verified</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{verifiedCount}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{pendingCount}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading verifications...</div>
        ) : filteredVerifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No verifications found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVerifications.map((verification) => (
              <div
                key={verification.id}
                className={`bg-gray-800 border ${
                  verification.is_verified ? 'border-green-500/50' : 'border-gray-700'
                } rounded-xl p-6 hover:border-gray-600 transition-all duration-200`}
              >
                {/* Streamer Info */}
                <div className="mb-4 flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {(verification.name || verification.email || 'S').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {verification.name || 'No Name'}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1 truncate">
                      <MdEmail className="text-gray-500 flex-shrink-0" />
                      {verification.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {verification.plan || 'No Plan'}
                      </span>
                      {verification.is_verified ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                          <MdVerified />
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                          <MdPending />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Screenshot */}
                {verification.screenshot_url ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                      <MdImage />
                      Payment Screenshot:
                    </p>
                    <a
                      href={verification.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <img
                        src={verification.screenshot_url}
                        alt="Payment screenshot"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-600 group-hover:border-blue-500 transition-all cursor-pointer"
                      />
                    </a>
                    <a
                      href={verification.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1"
                    >
                      <MdImage />
                      View Full Size
                    </a>
                  </div>
                ) : (
                  <div className="mb-4 bg-gray-700/50 rounded-lg p-6 text-center border border-gray-600">
                    <MdImage className="text-4xl text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No screenshot uploaded</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mb-4">
                  {!verification.is_verified ? (
                    <>
                      <button
                        onClick={() => handleApprove(verification.id)}
                        disabled={approving === verification.id || !verification.screenshot_url}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <MdCheckCircle />
                        {approving === verification.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(verification.id)}
                        disabled={approving === verification.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <MdCancel />
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 text-center bg-green-500/10 border border-green-500/30 rounded-lg py-2.5 flex items-center justify-center gap-2 text-green-400">
                      <MdCheckCircle />
                      <span className="text-sm font-medium">Already Verified</span>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MdCalendarToday />
                    Registered: {new Date(verification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
