import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const VerificationUpload = () => {
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!screenshot) return;

    setUploading(true);
    try {
      // Upload screenshot to Supabase Storage
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('verification-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification-screenshots')
        .getPublicUrl(fileName);

      // Update user profile with screenshot URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ screenshot_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Navigate to pending verification page
      navigate('/verification-pending');
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      alert('Failed to upload screenshot. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Upload Payment Verification
          </h1>
          <p className="text-gray-300 mb-8 text-center">
            Account Name: Inswinger+ Admin<br />
            Account Number: 1234567890<br />
            Bank: Example Bank
          </p>
          <p className="text-gray-300 mb-8 text-center">
            Please upload a screenshot of your payment confirmation. Our admin team will verify your account within 24-48 hours.
          </p>

          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Screenshot
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                <div className="space-y-1 text-center">
                  {preview ? (
                    <div className="mb-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="mx-auto h-64 w-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none px-3 py-2"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                    <p className="pl-1 py-2">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">Instructions:</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Take a screenshot of your payment confirmation</li>
                <li>Make sure the transaction details are clearly visible</li>
                <li>Include the payment amount and date</li>
                <li>Admin will verify within 24-48 hours</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={!screenshot || uploading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerificationUpload;
