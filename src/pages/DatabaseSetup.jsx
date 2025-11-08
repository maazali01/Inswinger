import { useState, useEffect } from 'react';
import { testSupabaseConnection } from '../lib/dbCheck';

const DatabaseSetup = () => {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setChecking(true);
    const result = await testSupabaseConnection();
    setStatus(result);
    setChecking(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Checking database connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="card max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            <span className="neon-text">Inswinger</span>
            <span className="text-blue-500">+</span>
          </h1>
          <h2 className="text-2xl font-bold text-white">Database Setup Required</h2>
        </div>

        {status && !status.setupComplete && (
          <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-yellow-500 font-semibold mb-2">Database Not Set Up</p>
                <p className="text-gray-300 text-sm">{status.message}</p>
              </div>
            </div>
          </div>
        )}

        {status && status.connected && !status.setupComplete && (
          <div className="space-y-6">
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Setup Instructions</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li>Go to your Supabase project dashboard</li>
                <li>Click on "SQL Editor" in the left sidebar</li>
                <li>Open the file <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">SUPABASE_SETUP.md</code> in your project</li>
                <li>Copy all the SQL commands from that file</li>
                <li>Paste them into the SQL Editor</li>
                <li>Click "Run" to execute</li>
                <li>Wait for success message</li>
                <li>Come back here and click "Check Again"</li>
              </ol>
            </div>

            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                <strong>Note:</strong> This is a one-time setup. The SQL will create all necessary tables, 
                security policies, and storage buckets for your application.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={checkConnection}
                className="btn-primary flex-1"
              >
                Check Again
              </button>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 text-center"
              >
                Open Supabase Dashboard
              </a>
            </div>
          </div>
        )}

        {status && !status.connected && (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-red-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-500 font-semibold mb-2">Connection Failed</p>
                  <p className="text-gray-300 text-sm mb-4">{status.message}</p>
                  
                  <div className="bg-gray-800 rounded p-4 mt-4">
                    <p className="text-gray-400 text-sm mb-2">Check your <code className="text-blue-400">.env</code> file:</p>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={checkConnection}
              className="btn-primary w-full"
            >
              Retry Connection
            </button>
          </div>
        )}

        {status && status.connected && status.setupComplete && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-500 font-semibold">Database Setup Complete!</p>
                <p className="text-gray-300 text-sm mt-1">You can now use the application.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseSetup;
