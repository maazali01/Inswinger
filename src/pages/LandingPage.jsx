import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import { FaPlay, FaCalendar, FaNewspaper, FaArrowRight, FaTrophy, FaUsers, FaFire } from 'react-icons/fa';
import { format } from 'date-fns';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [liveStreams, setLiveStreams] = useState([]);
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandingData();
  }, []);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user && profile) {
      switch (profile.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'streamer':
          navigate('/streamer/dashboard', { replace: true });
          break;
        case 'user':
          navigate('/home', { replace: true });
          break;
        default:
          break;
      }
    }
  }, [user, profile, navigate]);

  const fetchLandingData = async () => {
    try {
      setLoading(true);

      // Fetch live and upcoming streams
      const { data: streamsData } = await supabase
        .from('streams')
        .select(`
          *,
          stream_types(*),
          users(name)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      const now = new Date();
      const live = [];
      const upcoming = [];

      (streamsData || []).forEach((stream) => {
        const startTime = stream.stream_types?.start_time ? new Date(stream.stream_types.start_time) : null;
        const endTime = stream.stream_types?.end_time ? new Date(stream.stream_types.end_time) : null;
        
        if (startTime && endTime && now >= startTime && now <= endTime) {
          live.push(stream);
        } else if (startTime && startTime > now) {
          upcoming.push(stream);
        }
      });

      setLiveStreams(live.slice(0, 3));
      setUpcomingStreams(upcoming.slice(0, 3));

      // Fetch latest blogs
      const { data: blogsData } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      setBlogs(blogsData || []);

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3);

      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching landing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Inswinger+ | Live Sports Streaming Platform"
        description="Watch live sports streams, read latest sports blogs, and stay updated with upcoming events. Your ultimate sports streaming destination."
        keywords="sports streaming, live sports, football, cricket, basketball, sports events, sports blogs"
        canonical="/"
      />
      
      <div className="min-h-screen bg-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-sport py-20">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 neon-text">
              Welcome to Inswinger+
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Your Ultimate Sports Streaming Destination - Watch Live Sports, Read Latest Blogs, and Stay Updated with Events
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link to="/signup" className="btn-primary text-lg px-8 py-4 inline-block">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg px-8 py-4 inline-block">
                    Sign In
                  </Link>
                </>
              ) : (
                <Link to="/home" className="btn-primary text-lg px-8 py-4 inline-block">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <FaFire className="text-5xl text-red-500 mb-3" />
                <h3 className="text-3xl font-bold text-white">{liveStreams.length}</h3>
                <p className="text-gray-400">Live Streams</p>
              </div>
              <div className="flex flex-col items-center">
                <FaTrophy className="text-5xl text-yellow-500 mb-3" />
                <h3 className="text-3xl font-bold text-white">{events.length}+</h3>
                <p className="text-gray-400">Upcoming Events</p>
              </div>
              <div className="flex flex-col items-center">
                <FaUsers className="text-5xl text-blue-500 mb-3" />
                <h3 className="text-3xl font-bold text-white">{blogs.length}+</h3>
                <p className="text-gray-400">Latest Blogs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          {/* Live Streams Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FaPlay className="text-3xl text-red-500" />
                <h2 className="text-3xl font-bold text-white">Live Now</h2>
              </div>
              {user && (
                <Link to="/home" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                  View All <FaArrowRight />
                </Link>
              )}
            </div>
            {liveStreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveStreams.map((stream) => (
                  <div key={stream.id} className="card group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 animate-pulse">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                          LIVE
                        </span>
                      </div>
                      {stream.stream_link && (
                        <img 
                          src={stream.stream_types?.thumbnail || '/default-thumbnail.jpg'} 
                          alt={stream.stream_types?.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = '/vite.svg';
                          }}
                        />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {stream.stream_types?.title || 'Untitled Stream'}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      <span className="text-blue-400">{stream.stream_types?.sport}</span> • {stream.users?.name}
                    </p>
                    {user ? (
                      <Link to={`/stream/${stream.id}`} className="btn-primary text-sm w-full text-center">
                        Watch Now
                      </Link>
                    ) : (
                      <Link to="/signup" className="btn-primary text-sm w-full text-center">
                        Sign Up to Watch
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-400">No live streams at the moment. Check back soon!</p>
              </div>
            )}
          </section>

          {/* Upcoming Streams Section */}
          {upcomingStreams.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <FaCalendar className="text-3xl text-yellow-500" />
                  <h2 className="text-3xl font-bold text-white">Coming Soon</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingStreams.map((stream) => (
                  <div key={stream.id} className="card hover:shadow-2xl transition-all duration-300">
                    <div className="aspect-video bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                      <FaCalendar className="text-5xl text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {stream.stream_types?.title || 'Untitled Stream'}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      <span className="text-blue-400">{stream.stream_types?.sport}</span>
                    </p>
                    <p className="text-sm text-yellow-500">
                      {stream.stream_types?.start_time && format(new Date(stream.stream_types.start_time), 'MMM dd, yyyy • hh:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

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
            {blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <div key={blog.id} className="card group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="aspect-video bg-gradient-neon rounded-lg mb-4 flex items-center justify-center">
                      <FaNewspaper className="text-5xl text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                      {blog.content.substring(0, 150)}...
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                    </p>
                    {user ? (
                      <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2">
                        Read More <FaArrowRight />
                      </button>
                    ) : (
                      <Link to="/signup" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2">
                        Sign Up to Read <FaArrowRight />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-400">No blogs available. Check back soon!</p>
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
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="card group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="aspect-video bg-gradient-sport rounded-lg mb-4 flex items-center justify-center">
                      <FaTrophy className="text-6xl text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    <p className="text-sm text-purple-400 font-semibold">
                      {format(new Date(event.event_date), 'MMMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.location}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-400">No upcoming events. Check back soon!</p>
              </div>
            )}
          </section>

          {/* CTA Section */}
          {!user && (
            <section className="bg-gradient-neon rounded-2xl p-12 text-center">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
                Join thousands of sports fans. Watch live streams, read expert analysis, and never miss a game!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="btn-primary text-lg px-8 py-4 inline-block bg-white text-gray-900 hover:bg-gray-100">
                  Sign Up Now
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4 inline-block border-white text-white hover:bg-white hover:text-gray-900">
                  Sign In
                </Link>
              </div>
            </section>
          )}
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
