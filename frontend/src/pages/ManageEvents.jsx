import { useState, useEffect, useMemo } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await API.get("/events");
      setEvents(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch events");
      setLoading(false);
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    // clear search and re-fetch events
    setQuery("");
    setLoading(true);
    await fetchEvents();
  };

  const handleEdit = (event) => {
    navigate(`/admin/events/edit/${event._id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const token = localStorage.getItem("token");
        await API.delete(`/events/${id}`, { headers: { "x-auth-token": token } });
        alert("Event deleted successfully!");
        fetchEvents();
      } catch (err) {
        alert(err.response?.data?.msg || "Failed to delete event");
        console.error(err);
      }
    }
  };

  const handleEndEvent = async (id) => {
    if (window.confirm("Are you sure you want to end this event? This action cannot be undone.")) {
      try {
        const token = localStorage.getItem("token");
        await API.put(`/events/${id}/end`, {}, { headers: { "x-auth-token": token } });
        alert("Event ended successfully!");
        fetchEvents();
      } catch (err) {
        alert(err.response?.data?.msg || "Failed to end event");
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading events...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl font-semibold">Manage Events</h1>
        <div className="text-sm text-gray-600">Total events: <span className="font-medium text-gray-800">{events.length}</span></div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full max-w-lg">
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events by name..."
            className="block w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-2 p-1 rounded-md text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 8.586L15.657 2.93a1 1 0 111.414 1.414L11.414 10l5.657 5.657a1 1 0 01-1.414 1.414L10 11.414l-5.657 5.657A1 1 0 012.93 15.657L8.586 10 2.93 4.343A1 1 0 014.343 2.93L10 8.586z" clipRule="evenodd" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="ml-auto">
          <button
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh events"
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${loading ? 'bg-green-400 opacity-70 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto shadow-sm rounded-lg">
          <table className="min-w-full table-auto table-fixed" style={{fontSize: '103%'}}>
            <thead>
              <tr className="bg-white/90 border-b border-gray-200">
                <th className="px-4 py-3 sticky top-0 text-left text-xs font-bold text-gray-700" style={{width: '6%'}}>Sr No</th>
                <th className="px-4 py-3 sticky top-0 text-left text-xs font-bold text-gray-700" style={{width: '40%'}}>Event Name</th>
                <th className="px-4 py-3 sticky top-0 text-left text-xs font-bold text-gray-700" style={{width: '18%'}}>Location</th>
                <th className="px-4 py-3 sticky top-0 text-left text-xs font-bold text-gray-700" style={{width: '14%'}}>Date</th>
                <th className="px-4 py-3 sticky top-0 text-left text-xs font-bold text-gray-700" style={{width: '12%'}}>Capacity</th>
                <th className="px-4 py-3 sticky top-0 text-right text-xs font-bold text-gray-700" style={{width: '10%'}}> </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(() => {
                const q = query.trim().toLowerCase();
                const filtered = q ? events.filter(e => (e.name || "").toLowerCase().includes(q)) : events;
                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td className="p-6 text-center text-sm text-gray-500" colSpan={6}>No events found.</td>
                    </tr>
                  );
                }

                return filtered.map((event, idx) => {
                  const registered = event.registrations ? event.registrations.length : 0;
                  const total = event.maxCapacity || "-";
                  return (
                    <tr key={event._id} className={`${event.isEnded ? 'opacity-70' : ''} hover:bg-gray-50`}>
                      <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{event.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{event.location || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{event.time ? new Date(event.time).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{registered} / {total}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-3 justify-end">
                          <button
                            onClick={() => navigate(`/admin/events/${event._id}`)}
                            aria-label="View details"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          >
                            <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      
    </div>
  );
}
