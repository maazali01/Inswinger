import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { generateEventDescription } from '../../lib/gemini'; // Still works, file handles OpenAI now
import { SPORTS_CATEGORIES } from '../../lib/constants';
import { MdAdd, MdEdit, MdDelete, MdClose, MdEvent, MdCalendarToday, MdLocationOn, MdSports, MdAutoAwesome } from 'react-icons/md';
import { useToast } from '../../components/ToastContainer';

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    location: '',
    event_date: '',
    event_time: '',
  });
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('upcoming_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      alert(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormData({
      title: '',
      description: '',
      sport: '',
      location: '',
      event_date: '',
      event_time: '',
    });
    setShowModal(true);
  };

  const openEdit = (event) => {
    setEditing(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      sport: event.sport || '',
      location: event.location || '',
      event_date: event.event_date || '',
      event_time: event.event_time || '',
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      toast.warning('Please enter an event title first');
      return;
    }

    setGenerating(true);
    try {
      const generatedDescription = await generateEventDescription(formData.title);
      setFormData(prev => ({ ...prev, description: generatedDescription }));
      toast.success('Description generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate description. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase
          .from('upcoming_events')
          .update(formData)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Event updated successfully!');
      } else {
        const { error } = await supabase
          .from('upcoming_events')
          .insert([formData]);
        if (error) throw error;
        toast.success('Event added successfully!');
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      console.error('Save event error:', err);
      toast.error(err.message || 'Failed to save event');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event? This action cannot be undone.')) return;
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('upcoming_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Event deleted successfully!');
      fetchEvents();
    } catch (err) {
      console.error('Delete event error:', err);
      toast.error(err.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = sportFilter === 'all' || event.sport === sportFilter;
    return matchesSearch && matchesSport;
  });

  const upcomingEvents = filteredEvents.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = filteredEvents.filter(e => new Date(e.event_date) < new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64 flex items-center justify-center">
          <div className="text-gray-100 text-xl">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Event Management | Admin - Inswinger+</title>
        <meta name="description" content="Manage upcoming sports events, schedules, and fixtures for Inswinger+ platform." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="flex-1 p-8 md:ml-64">
          <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Event Management</h1>
              <p className="mt-2 text-gray-400">Manage upcoming sports events</p>
            </div>
            <button 
              onClick={openAdd} 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MdAdd className="text-xl" />
              <span className="font-medium">Add Event</span>
            </button>
          </header>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <MdEvent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <MdClose />
                  </button>
                )}
              </div>
            </div>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Sports</option>
              {SPORTS_CATEGORIES.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-white mt-1">{events.length}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Upcoming Events</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{upcomingEvents.length}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Past Events</p>
              <p className="text-2xl font-bold text-gray-400 mt-1">{pastEvents.length}</p>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No events found.</div>
            ) : (
              filteredEvents.map(event => {
                const eventDate = event.event_date ? new Date(event.event_date) : null;
                const isPast = eventDate && eventDate < new Date();
                
                return (
                  <div 
                    key={event.id} 
                    className={`bg-gray-800 border ${isPast ? 'border-gray-700 opacity-75' : 'border-gray-700'} rounded-xl p-6 hover:border-gray-600 transition-all duration-200`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 ${isPast ? 'bg-gray-700/50' : 'bg-orange-500/10'} rounded-lg`}>
                            <MdEvent className={`text-2xl ${isPast ? 'text-gray-500' : 'text-orange-400'}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              {event.sport && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                  <MdSports />
                                  {event.sport}
                                </span>
                              )}
                              {event.location && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                  <MdLocationOn className="text-blue-400" />
                                  {event.location}
                                </span>
                              )}
                              {eventDate && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                  <MdCalendarToday className="text-green-400" />
                                  {eventDate.toLocaleDateString()} {event.event_time && `at ${event.event_time}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEdit(event)} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                          <MdEdit />
                          <span className="text-xs font-medium">Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MdDelete />
                          <span className="text-xs font-medium">
                            {deletingId === event.id ? 'Deleting...' : 'Delete'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editing ? 'Edit Event' : 'Add Event'}
                  </h2>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MdClose className="text-xl" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                    <input 
                      name="title" 
                      value={formData.title} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Premier League Final"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">Description</label>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={generating || !formData.title.trim()}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <MdAutoAwesome className={generating ? 'animate-spin' : ''} />
                        {generating ? 'Generating...' : 'Generate with AI'}
                      </button>
                    </div>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      rows="3" 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      placeholder="Event description..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Sport *</label>
                      <select
                        name="sport"
                        value={formData.sport}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select sport</option>
                        {SPORTS_CATEGORIES.map((sport) => (
                          <option key={sport} value={sport}>
                            {sport}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                      <input 
                        name="location" 
                        value={formData.location} 
                        onChange={handleChange} 
                        required 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Stadium name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Event Date *</label>
                      <input 
                        type="date" 
                        name="event_date" 
                        value={formData.event_date} 
                        onChange={handleChange} 
                        required 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Event Time</label>
                      <input 
                        type="time" 
                        name="event_time" 
                        value={formData.event_time} 
                        onChange={handleChange} 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="submit" 
                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editing ? 'Save Changes' : 'Add Event'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className="flex-1 bg-gray-700 text-gray-300 py-2.5 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
