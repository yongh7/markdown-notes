/**
 * Landing page with login/register and public notes feed
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, LogIn } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import { PublicNotesFeed } from '../components/Public/PublicNotesFeed';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  // If authenticated, show landing with workspace access
  if (isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
              </div>
              <button
                onClick={() => navigate('/workspace')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Workspace
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your Knowledge Base
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Organize your thoughts, share your knowledge
            </p>
          </div>

          {/* Popular Notes Section */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Popular Notes</h3>
            <PublicNotesFeed limit={10} />
          </section>
        </main>
      </div>
    );
  }

  // If showing login modal
  if (showLogin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-2 max-w-md w-full">
          <button
            onClick={() => setShowLogin(false)}
            className="mb-2 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <Login
            onSwitchToRegister={() => {
              setShowLogin(false);
              setShowRegister(true);
            }}
          />
        </div>
      </div>
    );
  }

  // If showing register modal
  if (showRegister) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-2 max-w-md w-full">
          <button
            onClick={() => setShowRegister(false)}
            className="mb-2 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <Register
            onSwitchToLogin={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
          />
        </div>
      </div>
    );
  }

  // Default landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Your Personal Knowledge Base
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create, organize, and share your markdown notes with the world
          </p>
          <button
            onClick={() => setShowRegister(true)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Get Started Free
          </button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-3">📝 Markdown Editor</h3>
            <p className="text-gray-600">
              Powerful Monaco editor with live preview and math rendering
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-3">🌐 Share Knowledge</h3>
            <p className="text-gray-600">
              Make notes public to share with the community
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-3">🔒 Privacy First</h3>
            <p className="text-gray-600">
              Keep notes private or public - you're in control
            </p>
          </div>
        </div>

        {/* Popular Notes Section */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Explore Popular Notes</h3>
          <PublicNotesFeed limit={10} />
        </section>
      </main>
    </div>
  );
}
