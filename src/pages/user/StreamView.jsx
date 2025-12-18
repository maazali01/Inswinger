import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { slugify, generateStreamUrl } from '../../lib/utils';
import { SEO_METADATA } from '../../lib/seo';
import SEO from '../../components/SEO';

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
          users(name, id)
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
        navigate('/home');
        return;
      }

      setStream(matchedStream);
    } catch (error) {
      console.error('Error fetching stream:', error);
      navigate('/home');
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
    if (!newMessage.trim() || sending || !stream?.id) return;

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
                <div className="flex items-center text-sm text-gray-400 space-x-4">
                  <span className="text-blue-400">{stream.stream_types?.sport}</span>
                  <span>•</span>
                  <span>Streamed by {stream.users?.name}</span>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StreamView;
