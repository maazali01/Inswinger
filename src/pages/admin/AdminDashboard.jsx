import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { MdPeople, MdVerified, MdPending, MdVideoLibrary, MdEvent, MdArticle, MdTrendingUp, MdPersonAdd } from 'react-icons/md';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedStreamers: 0,
    pendingStreamers: 0,
    totalStreams: 0,
    upcomingEvents: 0,
    totalBlogs: 0,
    recentUsers: 0,
    activeStreamers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // fetch counts (lightweight queries)
      const [{ count: usersCount }, { count: streamsCount }, { count: eventsCount }, { count: blogsCount }] = await Promise.all([
        supabase.from('users').select('id', { head: true, count: 'exact' }),
        supabase.from('streams').select('id', { head: true, count: 'exact' }),
        supabase.from('upcoming_events').select('id', { head: true, count: 'exact' }),
        supabase.from('blogs').select('id', { head: true, count: 'exact' }),
      ]);

      // get verified / pending streamers counts
      const { data: streamerData } = await supabase
        .from('users')
        .select('id, role, is_verified, created_at');

      const verifiedStreamers = streamerData?.filter(u => u.role === 'streamer' && u.is_verified).length || 0;
      const pendingStreamers = streamerData?.filter(u => u.role === 'streamer' && !u.is_verified).length || 0;
      
      // Users registered in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUsers = streamerData?.filter(u => new Date(u.created_at) > sevenDaysAgo).length || 0;
      
      // Active streamers (verified + has streams)
      const { data: streamersWithStreams } = await supabase
        .from('streams')
        .select('streamer_id')
        .not('streamer_id', 'is', null);
      
      const uniqueActiveStreamers = new Set(streamersWithStreams?.map(s => s.streamer_id) || []).size;

      setStats({
        totalUsers: usersCount || 0,
        verifiedStreamers,
        pendingStreamers,
        totalStreams: streamsCount || 0,
        upcomingEvents: eventsCount || 0,
        totalBlogs: blogsCount || 0,
        recentUsers,
        activeStreamers: uniqueActiveStreamers,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get 5 most recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(recentUsers || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: MdPeople, color: 'text-blue-400' },
    { label: 'Verified Streamers', value: stats.verifiedStreamers, icon: MdVerified, color: 'text-green-400' },
    { label: 'Pending Streamers', value: stats.pendingStreamers, icon: MdPending, color: 'text-yellow-400' },
    { label: 'Total Streams', value: stats.totalStreams, icon: MdVideoLibrary, color: 'text-purple-400' },
    { label: 'Upcoming Events', value: stats.upcomingEvents, icon: MdEvent, color: 'text-orange-400' },
    { label: 'Total Blogs', value: stats.totalBlogs, icon: MdArticle, color: 'text-pink-400' },
    { label: 'New Users (7 days)', value: stats.recentUsers, icon: MdPersonAdd, color: 'text-cyan-400' },
    { label: 'Active Streamers', value: stats.activeStreamers, icon: MdTrendingUp, color: 'text-emerald-400' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          <div className="text-gray-300">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-400">Monitor platform statistics and manage resources</p>
        </header>

        <section className="max-w-7xl space-y-8">
          {/* Stats grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{card.label}</p>
                      <p className="text-2xl font-bold mt-3 text-white">{card.value}</p>
                    </div>
                    <div className={`p-3 bg-gray-700/50 rounded-lg ${card.color}`}>
                      <Icon className="text-xl" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent User Registrations</h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent activity</p>
              ) : (
                recentActivity.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()
                        }</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name || 'No name'}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        user.role === 'streamer' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Platform Overview */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Streamer Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Verification Rate</span>
                  <span className="text-white font-semibold">
                    {stats.verifiedStreamers + stats.pendingStreamers > 0
                      ? Math.round((stats.verifiedStreamers / (stats.verifiedStreamers + stats.pendingStreamers)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        stats.verifiedStreamers + stats.pendingStreamers > 0
                          ? (stats.verifiedStreamers / (stats.verifiedStreamers + stats.pendingStreamers)) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-gray-400">Activity Rate</span>
                  <span className="text-white font-semibold">
                    {stats.verifiedStreamers > 0
                      ? Math.round((stats.activeStreamers / stats.verifiedStreamers) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        stats.verifiedStreamers > 0
                          ? (stats.activeStreamers / stats.verifiedStreamers) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Content Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MdVideoLibrary className="text-purple-400 text-xl" />
                    <span className="text-gray-300">Average Streams per Streamer</span>
                  </div>
                  <span className="text-white font-semibold">
                    {stats.activeStreamers > 0 ? Math.round(stats.totalStreams / stats.activeStreamers) : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MdEvent className="text-orange-400 text-xl" />
                    <span className="text-gray-300">Events Scheduled</span>
                  </div>
                  <span className="text-white font-semibold">{stats.upcomingEvents}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MdArticle className="text-pink-400 text-xl" />
                    <span className="text-gray-300">Published Blogs</span>
                  </div>
                  <span className="text-white font-semibold">{stats.totalBlogs}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
