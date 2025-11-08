import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MdEvent, MdCalendarToday, MdLocationOn, MdSports, MdClose, MdAccessTime } from 'react-icons/md';
import SEO from '../../components/SEO';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('upcoming_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
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

  const uniqueSports = [...new Set(events.map(e => e.sport).filter(Boolean))];

  const getDaysUntil = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Upcoming Sports Events",
    "description": "Schedule of upcoming sports events and matches",
    "itemListElement": upcomingEvents.slice(0, 10).map((event, index) => ({
      "@type": "SportsEvent",
      "position": index + 1,
      "name": event.title,
      "description": event.description,
      "startDate": event.event_date,
      "location": event.location ? {
        "@type": "Place",
        "name": event.location
      } : undefined,
      "sport": event.sport,
    })),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-100 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Upcoming Sports Events | Inswinger+ Schedule"
        description={`Discover ${upcomingEvents.length} upcoming sports events. Never miss a match with our comprehensive sports calendar covering football, cricket, basketball, and more.`}
        keywords="sports events, sports schedule, upcoming matches, football fixtures, cricket calendar, sports dates"
        canonical="/events"
        schema={schema}
      />
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-white mb-8">Upcoming Sports Events</h1>
          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-white mt-1">{events.length}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400">Upcoming Events</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{upcomingEvents.length}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400">Past Events</p>
              <p className="text-2xl font-bold text-gray-400 mt-1">{pastEvents.length}</p>
            </div>
          </div>
          {/* Search and Filter */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events by title or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pl-12 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <MdEvent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <MdClose />
                  </button>
                )}
              </div>
            </div>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Sports</option>
              {uniqueSports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <MdEvent className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">
                {searchTerm || sportFilter !== 'all' ? 'No events found matching your filters' : 'No events available yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const eventDate = event.event_date ? new Date(event.event_date) : null;
                const isPast = eventDate && eventDate < new Date();
                const daysUntil = eventDate ? getDaysUntil(event.event_date) : null;

                return (
                  <div
                    key={event.id}
                    className={`bg-gray-800 border ${isPast ? 'border-gray-700 opacity-75' : 'border-gray-700'} rounded-xl overflow-hidden hover:border-orange-500 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer group`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 ${isPast ? 'bg-gray-700/50' : 'bg-orange-500/10'} rounded-lg`}>
                          <MdEvent className={`text-2xl ${isPast ? 'text-gray-500' : 'text-orange-400'}`} />
                        </div>
                        {!isPast && daysUntil !== null && (
                          <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                          </span>
                        )}
                        {isPast && (
                          <span className="bg-gray-600 text-gray-400 text-xs px-3 py-1 rounded-full font-semibold">
                            Past
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-white mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Event Details */}
                      <div className="space-y-2">
                        {event.sport && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            <MdSports />
                            {event.sport}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MdCalendarToday className="text-green-400" />
                          {eventDate?.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          {event.event_time && (
                            <>
                              <MdAccessTime className="text-blue-400 ml-2" />
                              {event.event_time}
                            </>
                          )}
                        </div>

                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MdLocationOn className="text-red-400" />
                            {event.location}
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <button className="mt-4 w-full text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors text-center py-2 border border-orange-500/30 rounded-lg hover:bg-orange-500/10">
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <MdEvent className="text-3xl text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedEvent.title}</h2>
                    {selectedEvent.sport && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 mt-2 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <MdSports />
                        {selectedEvent.sport}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MdClose className="text-2xl" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedEvent.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <MdCalendarToday className="text-green-400 text-xl" />
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-white font-medium">
                        {new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.event_time && (
                    <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                      <MdAccessTime className="text-blue-400 text-xl" />
                      <div>
                        <p className="text-xs text-gray-400">Time</p>
                        <p className="text-white font-medium">{selectedEvent.event_time}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg sm:col-span-2">
                      <MdLocationOn className="text-red-400 text-xl" />
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-white font-medium">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EventsPage;
