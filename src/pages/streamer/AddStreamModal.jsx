import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const AddStreamModal = ({ streamTypes, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    stream_type_id: '',
    stream_link: '',
    number_of_ads: 0,
    adult_ads: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Submitting stream:', formData);
      
      const { data, error: insertError } = await supabase
        .from('streams')
        .insert([
          {
            streamer_id: user.id,
            stream_type_id: formData.stream_type_id,
            stream_link: formData.stream_link,
            number_of_ads: parseInt(formData.number_of_ads),
            adult_ads: formData.adult_ads,
          },
        ])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      
      console.log('Stream added successfully:', data);
      alert('Stream added successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error adding stream:', err);
      const errorMessage = err.message || 'Failed to add stream. Please check database setup.';
      setError(errorMessage);
      
      // Show more helpful error for common issues
      if (err.code === '42P01') {
        setError('Database tables not found. Please run the setup SQL from SUPABASE_SETUP.md');
      } else if (err.code === '23503') {
        setError('Invalid stream type selected or user not verified.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Stream</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stream Type
            </label>
            <select
              name="stream_type_id"
              value={formData.stream_type_id}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Select a stream type</option>
              {streamTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.title} ({type.sport})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stream Link (URL)
            </label>
            <input
              type="url"
              name="stream_link"
              value={formData.stream_link}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="https://example.com/stream"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Ads
            </label>
            <input
              type="number"
              name="number_of_ads"
              value={formData.number_of_ads}
              onChange={handleChange}
              min="0"
              required
              className="input-field"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="adult_ads"
              id="adult_ads"
              checked={formData.adult_ads}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="adult_ads" className="ml-2 text-sm text-gray-300">
              Enable Adult Ads
            </label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Stream'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStreamModal;
