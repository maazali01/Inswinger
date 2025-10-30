'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  const updateRole = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) return alert(error.message);
    alert('Role updated');
    fetchUsers();
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('Delete user profile? This will remove profile row (auth user not removed).')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) return alert(error.message);
    alert('Profile deleted');
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="p-4 bg-white border rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{u.full_name || u.email}</div>
                <div className="text-xs text-slate-600">{u.email}</div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                  className="border px-2 py-1 rounded"
                >
                  <option value="user">user</option>
                  <option value="streamer">streamer</option>
                  <option value="admin">admin</option>
                  <option value="visitor">visitor</option>
                </select>
                <Button variant="destructive" onClick={() => deleteProfile(u.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
