import { useState, useEffect } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      <h1 className="text-3xl font-bold mb-6">Manage Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event._id}
              className={`bg-white p-4 rounded-lg shadow-md ${event.isEnded ? 'opacity-70' : ''}`}
            >
              {event.photo && (
                <img
                  src={`http://localhost:5000${event.photo}`}
                  alt={event.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              <h3
                className="text-lg font-semibold mb-2"
              >
                {event.name} {event.isEnded && <span className="text-red-500 text-sm">(Ended)</span>}
              </h3>
              <p className="text-sm text-gray-600">Location: {event.location}</p>
              <p className="text-sm text-gray-600">Time: {new Date(event.time).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Capacity: {event.maxCapacity}</p>
              <p className="text-sm text-gray-600">Registered: {event.registrations ? event.registrations.length : 0}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleEdit(event)}
                  className="bg-yellow-500 text-white p-1 rounded text-sm hover:bg-yellow-600 cursor-pointer"
                  disabled={event.isEnded}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="bg-red-500 text-white p-1 rounded text-sm hover:bg-red-600 cursor-pointer"
                  disabled={event.isEnded}
                >
                  Delete
                </button>
                {!event.isEnded && (
                  <button
                    onClick={() => handleEndEvent(event._id)}
                    className="bg-gray-600 text-white p-1 rounded text-sm hover:bg-gray-700 cursor-pointer"
                  >
                    End Event
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No events found.</p>
        )}
      </div>
    </div>
  );
}
