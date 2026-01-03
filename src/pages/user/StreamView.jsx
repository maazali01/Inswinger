import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { slugify, generateStreamUrl } from '../../lib/utils';
import { SEO_METADATA } from '../../lib/seo';
import SEO from '../../components/SEO';
import { PLAN_INFO } from '../../lib/constants';

const StreamView = () => {
  const { slug, streamerSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchStream = useCallback(async () => {
    try {
      const { data: streams, error } = await supabase
        .from('streams')
        .select(`
          *,
          stream_types(*),
          users(name, id, plan)
        `);

      if (error) throw error;

      // Find stream by matching slug and optionally streamer slug
      const matchedStream = streams?.find(s => {
        const streamSlug = slugify(s.stream_types?.title);
        const userSlug = slugify(s.users?.name);
        
        // If streamerSlug is provided, match both
        if (streamerSlug) {
          return streamSlug === slug && userSlug === streamerSlug;
        }
        
        // Otherwise just match stream slug
        return streamSlug === slug;
      });

      if (!matchedStream) {
        navigate('/');
        return;
      }

      setStream(matchedStream);
    } catch (error) {
      console.error('Error fetching stream:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [slug, streamerSlug, navigate]);

  const fetchMessages = useCallback(async () => {
    if (!stream?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          users(name)
        `)
        .eq('stream_id', stream.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [stream?.id]);

  const subscribeToMessages = useCallback(() => {
    if (!stream?.id) return;

    const channel = supabase
      .channel(`chat:${stream.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${stream.id}`,
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', payload.new.user_id)
            .single();

          setMessages((prev) => [...prev, { ...payload.new, users: userData }]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [stream?.id]);

  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  useEffect(() => {
    if (stream) {
      fetchMessages();
      const cleanup = subscribeToMessages();
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [stream, fetchMessages, subscribeToMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending || !stream?.id) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    const optimisticMessage = {
      id: tempId,
      stream_id: stream.id,
      user_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      users: { name: user.email.split('@')[0] }
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          stream_id: stream.id,
          user_id: user.id,
          message: messageText,
        }])
        .select(`
          *,
          users(name)
        `)
        .single();

      if (error) throw error;

      setMessages((prev) => 
        prev.map((msg) => msg.id === tempId ? { ...data, users: data.users } : msg)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const schema = stream ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": stream.stream_types?.title || 'Sports Stream',
    "description": stream.seo_description || `Watch ${stream.stream_types?.title} live on Inswinger+`,
    "uploadDate": stream.created_at,
    "thumbnailUrl": stream.stream_types?.thumbnail || '/default-thumbnail.jpg',
    "embedUrl": stream.stream_url,
    "contentUrl": stream.stream_url,
    "sport": stream.stream_types?.sport,
    "isLiveBroadcast": stream.is_live,
  } : null;

  if (loading) {
    return (
      <>
        <SEO
          title="Loading Stream | Inswinger+"
          description="Loading stream content"
          keywords="sports streaming"
        />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (!stream) {
    return (
      <>
        <SEO
          title="Stream Not Found | Inswinger+"
          description="The requested stream could not be found"
          keywords="sports streaming"
        />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <p className="text-white text-xl">Stream not found</p>
        </div>
      </>
    );
  }

  const streamSeo = SEO_METADATA.streamView(stream.seo_title || stream.stream_types?.title);
  const streamerPlan = stream.users?.plan;
  const planInfo = PLAN_INFO[streamerPlan];

  // Check if user needs authentication for this stream
  const requiresAuth = streamerPlan === 'premium' || streamerPlan === 'professional';
  const isBasicStream = streamerPlan === 'basic';

  // If stream requires authentication and user is not logged in, show sign-in prompt
  if (requiresAuth && !user) {
    return (
      <>
        <SEO
          title={stream.seo_title || streamSeo.title}
          description="Sign in to watch premium sports streams"
          keywords={streamSeo.keywords}
          canonical={generateStreamUrl(stream.stream_types?.title, stream.users?.name)}
        />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
          <div className="card max-w-2xl text-center">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Premium Content
              </h1>
              <p className="text-xl text-gray-300 mb-2">
                {stream.stream_types?.title}
              </p>
              {planInfo && (
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${planInfo.bgColor} ${planInfo.textColor} border ${planInfo.borderColor} text-sm font-semibold mb-6`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {planInfo.name} Tier Stream
                </span>
              )}
            </div>

            <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
              <p className="text-gray-300 mb-4">
                This is a {planInfo?.name || 'premium'} tier stream. Sign in to watch exclusive content from our top streamers.
              </p>
              <ul className="text-left text-gray-300 space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>HD Quality Streaming</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Live Chat with Community</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Access to All Premium Streams</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Real-time Updates</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4">
              <a href="/signup" className="flex-1 btn-primary py-3">
                Sign Up Free
              </a>
              <a href="/login" className="flex-1 btn-secondary py-3">
                Sign In
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Already have an account? <a href="/login" className="text-blue-400 hover:text-blue-300">Sign in here</a>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={stream.seo_title || streamSeo.title}
        description={stream.seo_description || streamSeo.description}
        keywords={stream.seo_keywords || streamSeo.keywords}
        canonical={generateStreamUrl(stream.stream_types?.title, stream.users?.name)}
        schema={schema}
      />
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Show "Free Stream" badge for guests viewing basic streams */}
          {isBasicStream && !user && (
            <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">
                  FREE STREAM
                </span>
                <p className="text-gray-300 text-sm">
                  You're watching a free stream. Sign in to access premium content and join the chat!
                </p>
              </div>
              <div className="flex gap-2">
                <a href="/signup" className="btn-primary text-sm px-4 py-2">
                  Sign Up
                </a>
                <a href="/login" className="btn-secondary text-sm px-4 py-2">
                  Sign In
                </a>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {stream.stream_link ? (
                  <iframe
                    src={stream.stream_link}
                    className="w-full h-full"
                    allowFullScreen
                    title={stream.stream_types?.title || 'Stream'}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <p>Stream URL not available</p>
                  </div>
                )}
              </div>

              {/* Stream Info */}
              <div className="card">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {stream.stream_types?.title}
                </h1>
                <div className="flex items-center flex-wrap gap-3 text-sm text-gray-400">
                  <span className="text-blue-400">{stream.stream_types?.sport}</span>
                  <span>•</span>
                  <span>Streamed by {stream.users?.name}</span>
                  
                  {/* Plan Badge */}
                  {planInfo && (
                    <>
                      <span>•</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${planInfo.bgColor} ${planInfo.textColor} border ${planInfo.borderColor} text-xs font-semibold`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {planInfo.name} Streamer
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Live Chat */}
            <div className="lg:col-span-1">
              <div className="card h-[600px] flex flex-col">
                <h2 className="text-xl font-bold text-white mb-4">Live Chat</h2>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-4 px-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center mt-4">No messages yet. Be the first to chat!</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="bg-gray-700 rounded-lg p-3 break-words">
                        <p className="text-xs font-semibold text-blue-400 mb-1">
                          {msg.users?.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-200">{msg.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {user ? (
                  <form onSubmit={sendMessage} className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="input-field flex-1"
                      maxLength={500}
                      disabled={sending}
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim() || sending}
                      className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? '...' : 'Send'}
                    </button>
                  </form>
                ) : (
                  <div className="mt-2 p-4 bg-gray-800 border border-gray-700 rounded-lg text-center">
                    <p className="text-gray-400 text-sm mb-3">Sign in to join the chat</p>
                    <div className="flex gap-2">
                      <a 
                        href="/login" 
                        className="btn-primary flex-1 text-center"
                      >
                        Sign In
                      </a>
                      <a 
                        href="/signup" 
                        className="btn-secondary flex-1 text-center"
                      >
                        Sign Up
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StreamView;
