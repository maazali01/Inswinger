import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MdDelete, MdVerified, MdPerson, MdEmail, MdCalendarToday, MdClose } from 'react-icons/md';

export default function UserManagement() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, is_verified, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      alert(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    if (authUser?.id === id) {
      alert('You cannot delete your own account.');
      return;
    }

    try {
      setDeletingId(id);
      
      // Call the delete_user function which deletes from both auth.users and public.users
      const { data, error } = await supabase.rpc('delete_user', { user_id: id });
      
      if (error) throw error;
      
      alert('User deleted successfully from both auth and database');
      
      // refresh list
      await fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'streamer':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'user':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-2 text-gray-400">Manage platform users and their roles</p>
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
              <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="streamer">Streamers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Verified</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {users.filter(u => u.is_verified).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">Filtered Results</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{filteredUsers.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-750 border-b border-gray-700">
                <tr>
                  <th className="py-4 px-6 text-left font-semibold text-gray-300">User</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-300">Role</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-300">Status</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-300">Joined</th>
                  <th className="py-4 px-6 text-center font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-700 last:border-0 hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {(u.name || u.email || 'U').charAt(0).toUpperCase()
                            }</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{u.name || 'No name'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MdEmail className="text-gray-500" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <MdVerified />
                            <span className="text-xs">Verified</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Not verified</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-gray-400">
                          <MdCalendarToday className="text-xs" />
                          <span className="text-xs">
                            {new Date(u.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id || authUser?.id === u.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MdDelete />
                            <span className="text-xs font-medium">
                              {deletingId === u.id ? 'Deleting...' : 'Delete'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
