import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    // Clear local storage and reload
    localStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
          <div className="card max-w-2xl text-center">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Something went wrong
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                The application encountered an unexpected error.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 text-left">
                <p className="text-red-400 text-sm font-mono">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary"
              >
                Reset and Go to Login
              </button>
              <Link to="/" className="btn-secondary">
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
