import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SEO_METADATA } from '../lib/seo';
import SEO from '../components/SEO';
import { FaPlay, FaCalendar, FaNewspaper, FaArrowRight, FaTrophy, FaUsers } from 'react-icons/fa';
import { MdVideoLibrary } from 'react-icons/md';
import { format } from 'date-fns';
import { PLAN_PRIORITY } from '../lib/constants';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [liveStreams, setLiveStreams] = useState([]);
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [streams, setStreams] = useState([]);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
    fetchBlogs();
    fetchEvents();
  }, []);

  const fetchStreams = async () => {
    try {
      setStreamsLoading(true);
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          stream_types(*),
          users(name, plan)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const now = new Date();
      
      // For landing page stats, show all streams count
      const allStreams = data || [];
      const basicStreams = allStreams.filter(s => s.users?.plan === 'basic');
      
      // Show ALL basic streams (live and offline)
      const live = basicStreams.filter(s => s.is_live);
      const offline = basicStreams.filter(s => !s.is_live);
      
      // Combine: live first, then offline
      const allBasicStreams = [...live, ...offline];

      setLiveStreams(allBasicStreams.slice(0, 6));
      
      // For stats, count all streams
      const allLiveCount = allStreams.filter(s => s.is_live).length;
      
      // Store total count for display
      setStreams(allStreams);
      
      // Still show upcoming for context
      const upcoming = basicStreams.filter(s => 
        !s.is_live && 
        s.stream_types?.start_time && 
        new Date(s.stream_types.start_time) > now
      );
      setUpcomingStreams(upcoming.slice(0, 3));
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setStreamsLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      setBlogsLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const { data, error } = await supabase
        .from('upcoming_events')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const generateStreamUrl = (title, username) => {
    const formattedTitle = title?.toLowerCase().replace(/\s+/g, '-') || 'untitled-stream';
    const userSegment = username ? `/${username.toLowerCase()}` : '';
    return `/stream/${formattedTitle}${userSegment}`;
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Inswinger+",
    "description": SEO_METADATA.landing.description,
    "url": window.location.origin,
  };

  return (
    <>
      <SEO
        title={SEO_METADATA.landing.title}
        description={SEO_METADATA.landing.description}
        keywords={SEO_METADATA.landing.keywords}
        canonical="/"
        schema={schema}
      />
      
      <div className="min-h-screen bg-gray-900">
        {/* Hero Section */}
        {/* <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Watch Live Sports <span className="text-yellow-400">Anywhere</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Stream your favorite sports events in HD quality. Football, Cricket, Basketball, Tennis, and more!
            </p>
            {!user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="btn-primary text-lg px-8 py-4 inline-block">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4 inline-block border-white text-white hover:bg-white hover:text-gray-900">
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/home" className="btn-primary text-lg px-8 py-4 inline-block">
                  Go to Dashboard
                </Link>
                <Link to="/blogs" className="btn-secondary text-lg px-8 py-4 inline-block border-white text-white hover:bg-white hover:text-gray-900">
                  Read Blogs
                </Link>
              </div>
            )}
          </div>
        </div> */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          {/* Free Streams Section - Simple CTA */}
          <section>
            <div className="text-center py-20">
              <div className="mb-8">
                <FaPlay className="text-6xl text-red-500 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">Watch Free Sports Streams</h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                  Browse our collection of free sports streams. No sign-up required to watch basic tier content!
                </p>
              </div>

              {/* Stream Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="text-3xl font-bold text-white mb-2">
                    {streamsLoading ? '...' : streams.length}
                  </div>
                  <div className="text-gray-400">Total Streams</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="text-3xl font-bold text-red-400 mb-2">
                    {streamsLoading ? '...' : streams.filter(s => s.is_live).length}
                  </div>
                  <div className="text-gray-400">Live Now</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {streamsLoading ? '...' : liveStreams.length}
                  </div>
                  <div className="text-gray-400">Free Streams</div>
                </div>
              </div>

              {/* Browse Button */}
              <Link 
                to="/browse" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <MdVideoLibrary className="text-2xl" />
                Browse Free Streams
                <FaArrowRight />
              </Link>

              <p className="text-gray-500 text-sm mt-6">
                Want access to premium streams? <Link to="/signup" className="text-blue-400 hover:text-blue-300">Sign up for free</Link>
              </p>
            </div>
          </section>

          {/* Latest Blogs Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FaNewspaper className="text-3xl text-green-500" />
                <h2 className="text-3xl font-bold text-white">Latest Blogs</h2>
              </div>
              {user && (
                <Link to="/blogs" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                  Read More <FaArrowRight />
                </Link>
              )}
            </div>
            {blogsLoading ? (
              <div className="text-gray-400">Loading blogs...</div>
            ) : blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <div key={blog.id} className="card group hover:shadow-2xl transition-all duration-300">
                    <div className="relative w-full h-48 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg overflow-hidden mb-4">
                      {blog.thumbnail ? (
                        <img 
                          src={blog.thumbnail} 
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaNewspaper className="text-5xl text-white opacity-50" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                      {blog.content?.substring(0, 150)}...
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mb-4">
                      <FaCalendar />
                      {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                    </p>
                    {user ? (
                      <Link to="/blogs" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 font-medium">
                        Read More <FaArrowRight />
                      </Link>
                    ) : (
                      <Link to="/signup" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 font-medium">
                        Sign Up to Read <FaArrowRight />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                No blogs available yet. Check back soon!
              </div>
            )}
          </section>

          {/* Upcoming Events Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FaTrophy className="text-3xl text-purple-500" />
                <h2 className="text-3xl font-bold text-white">Upcoming Events</h2>
              </div>
              {user && (
                <Link to="/events" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                  View All <FaArrowRight />
                </Link>
              )}
            </div>
            {eventsLoading ? (
              <div className="text-gray-400">Loading events...</div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="card group hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <FaTrophy className="text-3xl text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="text-sm">
                          <span className="text-purple-400 font-semibold flex items-center gap-2">
                            <FaCalendar />
                            {format(new Date(event.event_date), 'MMMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                No upcoming events scheduled yet.
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              © 2025 Inswinger+. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
