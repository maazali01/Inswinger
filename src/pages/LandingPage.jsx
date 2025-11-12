import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import { FaPlay, FaCalendar, FaNewspaper, FaArrowRight, FaTrophy, FaUsers, FaFire } from 'react-icons/fa';
import { format } from 'date-fns';

// Mock data for when database is empty
const MOCK_STREAMS = [
  {
    id: 'mock-1',
    stream_link: 'https://example.com/stream1',
    stream_types: {
      title: 'Premier League: Manchester United vs Liverpool',
      sport: 'Football',
      thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    },
    users: { name: 'SportsCaster Pro' }
  },
  {
    id: 'mock-2',
    stream_link: 'https://example.com/stream2',
    stream_types: {
      title: 'NBA Finals: Lakers vs Celtics',
      sport: 'Basketball',
      thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    },
    users: { name: 'NBA Streams' }
  },
  {
    id: 'mock-3',
    stream_link: 'https://example.com/stream3',
    stream_types: {
      title: 'IPL Cricket: Mumbai Indians vs Chennai',
      sport: 'Cricket',
      thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
    users: { name: 'Cricket Live HD' }
  }
];

const MOCK_UPCOMING = [
  {
    id: 'upcoming-1',
    stream_types: {
      title: 'Champions League: Real Madrid vs Barcelona',
      sport: 'Football',
      thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  },
  {
    id: 'upcoming-2',
    stream_types: {
      title: 'Wimbledon Finals: Tennis Championship',
      sport: 'Tennis',
      thumbnail: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80',
      start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    }
  },
  {
    id: 'upcoming-3',
    stream_types: {
      title: 'Formula 1: Monaco Grand Prix',
      sport: 'Racing',
      thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
      start_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    }
  }
];

const MOCK_BLOGS = [
  {
    id: 'blog-1',
    title: 'Top 10 Football Moments of the Season',
    content: 'From stunning goals to incredible saves, we count down the most memorable moments that defined this football season. The beautiful game has given us plenty to celebrate this year with record-breaking performances and unforgettable matches.',
    thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'blog-2',
    title: 'NBA Playoffs Preview: Teams to Watch',
    content: 'As the NBA playoffs approach, we analyze the top contenders and dark horses who could make a surprise run. From veteran superstars to emerging young talent, this year\'s playoffs promise to be one of the most competitive in recent history.',
    thumbnail: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'blog-3',
    title: 'Cricket World Cup: Expert Analysis and Predictions',
    content: 'Our cricket experts break down each team\'s chances in the upcoming World Cup. We look at form, key players, and historical performance to predict which nation will lift the trophy.',
    thumbnail: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_EVENTS = [
  {
    id: 'event-1',
    title: 'Super Bowl LVIII',
    description: 'The biggest game in American football returns to Las Vegas for an unforgettable championship showdown.',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Las Vegas, Nevada'
  },
  {
    id: 'event-2',
    title: 'UEFA Champions League Final',
    description: 'Europe\'s premier club competition reaches its climax as two teams battle for continental supremacy.',
    thumbnail: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
    event_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Wembley Stadium, London'
  },
  {
    id: 'event-3',
    title: 'Australian Open Tennis',
    description: 'The first Grand Slam of the year brings the world\'s best tennis players to Melbourne.',
    thumbnail: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&q=80',
    event_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Melbourne Park, Australia'
  }
];

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

      // Use mock data if no real data is available
      setLiveStreams(live.length > 0 ? live.slice(0, 3) : MOCK_STREAMS);
      setUpcomingStreams(upcoming.length > 0 ? upcoming.slice(0, 3) : MOCK_UPCOMING);

      // Fetch latest blogs
      const { data: blogsData } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      // Use mock data if no real data is available
      setBlogs((blogsData && blogsData.length > 0) ? blogsData : MOCK_BLOGS);

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3);

      // Use mock data if no real data is available
      setEvents((eventsData && eventsData.length > 0) ? eventsData : MOCK_EVENTS);
    } catch (error) {
      console.error('Error fetching landing data:', error);
      // On error, use mock data
      setLiveStreams(MOCK_STREAMS);
      setUpcomingStreams(MOCK_UPCOMING);
      setBlogs(MOCK_BLOGS);
      setEvents(MOCK_EVENTS);
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
              <div className="space-y-4">
                {liveStreams.map((stream) => (
                  <div key={stream.id} className="card group hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-full md:w-64 h-48 md:h-36 bg-black rounded-lg overflow-hidden flex-shrink-0">
                        <div className="absolute top-2 left-2 z-10">
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 animate-pulse">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                            LIVE
                          </span>
                        </div>
                        <img 
                          src={stream.stream_types?.thumbnail || '/default-thumbnail.jpg'} 
                          alt={stream.stream_types?.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = '/vite.svg';
                          }}
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                            {stream.stream_types?.title || 'Untitled Stream'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full font-medium">
                              {stream.stream_types?.sport}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaUsers className="text-gray-500" />
                              {stream.users?.name}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="mt-4">
                          {user ? (
                            <Link to={`/stream/${stream.id}`} className="btn-primary text-sm inline-flex items-center gap-2">
                              <FaPlay /> Watch Now
                            </Link>
                          ) : (
                            <Link to="/signup" className="btn-primary text-sm inline-flex items-center gap-2">
                              <FaPlay /> Sign Up to Watch
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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
              <div className="space-y-4">
                {upcomingStreams.map((stream) => (
                  <div key={stream.id} className="card group hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-full md:w-64 h-48 md:h-36 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={stream.stream_types?.thumbnail || '/default-thumbnail.jpg'} 
                          alt={stream.stream_types?.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = '/vite.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <FaCalendar className="text-4xl text-white" />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                            {stream.stream_types?.title || 'Untitled Stream'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full font-medium">
                              {stream.stream_types?.sport}
                            </span>
                            <span className="text-yellow-500 font-medium flex items-center gap-2">
                              <FaCalendar />
                              {stream.stream_types?.start_time && format(new Date(stream.stream_types.start_time), 'MMM dd, yyyy • hh:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div key={blog.id} className="card group hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-full md:w-64 h-48 md:h-36 bg-gradient-neon rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={blog.thumbnail || '/default-thumbnail.jpg'} 
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="text-5xl text-white w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"></path><path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"></path></svg></div>';
                          }}
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors line-clamp-2">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {blog.content.substring(0, 200)}...
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <FaCalendar />
                            {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        
                        {/* Action Button */}
                        <div className="mt-4">
                          {user ? (
                            <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 font-medium">
                              Read More <FaArrowRight />
                            </button>
                          ) : (
                            <Link to="/signup" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 font-medium">
                              Sign Up to Read <FaArrowRight />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="card group hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-full md:w-64 h-48 md:h-36 bg-gradient-sport rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={event.thumbnail || '/default-thumbnail.jpg'} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="text-6xl text-yellow-400 w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg></div>';
                          }}
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-purple-400 font-semibold flex items-center gap-2">
                              <FaCalendar />
                              {format(new Date(event.event_date), 'MMMM dd, yyyy')}
                            </span>
                            <span className="text-gray-500 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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
