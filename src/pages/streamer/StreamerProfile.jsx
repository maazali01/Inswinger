import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function StreamerProfile() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    bio: '',
    screenshot_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        screenshot_url: profile.screenshot_url || '',
      });
      setLoading(false);
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user?.id) {
      alert('User not loaded');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}-${Date.now()}.${ext}`;
      const bucket = 'verification-screenshots';
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = urlData?.publicUrl || '';
      // update local form so user sees new image before saving profile
      setForm(prev => ({ ...prev, screenshot_url: publicUrl }));
      alert('Upload successful. Remember to Save Profile to persist.');
    } catch (err) {
      console.error('Upload error', err);
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // clear input value to allow re-upload same file if needed
      e.target.value = '';
    }
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    if (!user?.id) {
      alert('User not loaded');
      return;
    }
    setSaving(true);
    try {
      const updates = {
        name: form.name,
        display_name: form.display_name,
        bio: form.bio,
        screenshot_url: form.screenshot_url || null,
        updated_at: new Date().toISOString(),
      };
      const targetId = profile?.id || user.id;
      const { error } = await supabase.from('users').update(updates).eq('id', targetId);
      if (error) throw error;
      alert('Profile updated. Reloading to refresh auth state...');
      window.location.reload();
    } catch (err) {
      console.error('Save profile error', err);
      alert(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-sm text-gray-400 mt-1">Update your streamer profile and verification screenshot</p>
        </header>

        {loading ? (
          <div className="text-gray-400">Loading profile...</div>
        ) : (
          <form onSubmit={handleSave} className="max-w-3xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Display name</label>
                <input
                  name="display_name"
                  value={form.display_name}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100"
                  placeholder="Public display name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 resize-none"
                placeholder="Short bio for your profile"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Verification Screenshot</label>
              <div className="flex items-center gap-4">
                <div className="w-28 h-20 bg-gray-800 border border-gray-700 rounded overflow-hidden flex items-center justify-center">
                  {form.screenshot_url ? (
                    <img src={form.screenshot_url} alt="screenshot" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-xs">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="text-sm text-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Upload a verification screenshot (used for streamer verification). File will be uploaded to storage and url saved when you press Save Profile.
                  </p>
                  {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    name: profile?.name || '',
                    display_name: profile?.display_name || '',
                    bio: profile?.bio || '',
                    screenshot_url: profile?.screenshot_url || '',
                  });
                }}
                className="flex-1 bg-gray-700 text-gray-300 py-2.5 rounded-lg hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
