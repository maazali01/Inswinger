import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/SEO';

const StreamView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStream();
    fetchMessages();
    const cleanup = subscribeToMessages();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchStream = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select(`
          *,
          stream_types(*),
          users(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setStream(data);
    } catch (error) {
      console.error('Error fetching stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          users(name)
        `)
        .eq('stream_id', id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${id}`,
        },
        async (payload) => {
          // Fetch user info for new message
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name')
            .eq('id', payload.new.user_id)
            .single();

          if (userError) {
            console.error('Error fetching user data:', userError);
          }

          // Add new message with user data
          const newMsg = {
            ...payload.new,
            users: userData || { name: 'Unknown User' }
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add message to UI
    const optimisticMessage = {
      id: tempId,
      stream_id: id,
      user_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      users: { name: user.email.split('@')[0] } // Use email prefix as fallback
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          stream_id: id,
          user_id: user.id,
          message: messageText,
        }])
        .select(`
          *,
          users(name)
        `)
        .single();

      if (error) throw error;

      // Replace optimistic message with real message
      setMessages((prev) => 
        prev.map((msg) => msg.id === tempId ? { ...data, users: data.users } : msg)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageText); // Restore message text
    } finally {
      setSending(false);
    }
  };

  const schema = stream ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": stream.stream_types?.title || 'Sports Stream',
    "description": `Watch ${stream.stream_types?.title} live on Inswinger+`,
    "uploadDate": stream.created_at,
    "thumbnailUrl": stream.stream_types?.thumbnail || '/default-thumbnail.jpg',
    "embedUrl": stream.stream_url,
    "contentUrl": stream.stream_url,
    "sport": stream.stream_types?.sport,
    "isLiveBroadcast": stream.is_live,
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Stream not found</p>
      </div>
    );
  }

  return (
    <>
      {stream && (
        <SEO
          title={`${stream.stream_types?.title || 'Stream'} | Watch Live on Inswinger+`}
          description={`Watch ${stream.stream_types?.title} live. ${stream.stream_types?.sport} streaming in HD quality on Inswinger+.`}
          keywords={`${stream.stream_types?.sport || 'sports'} live, ${stream.stream_types?.title}, watch ${stream.stream_types?.sport} online, live streaming`}
          canonical={`/stream/${stream.id}`}
          schema={schema}
        />
      )}
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
                
                {/* Messages */}
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

                {/* Message Input */}
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
