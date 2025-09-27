import { useState, useEffect } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function MyEvents() {
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("id");

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const { data } = await API.get("/events");
        const myEvents = data.filter(event =>
          event.registrations.some(reg => reg._id === userId)
        );
        setRegisteredEvents(myEvents);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch registered events.");
        setLoading(false);
        console.error(err);
      }
    };

    if (userId) {
      fetchMyEvents();
    } else {
      navigate("/login"); // Redirect to login if no user ID
    }
  }, [userId, navigate]);

  if (loading) {
    return <div className="text-center py-4">Loading registered events...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">My Registered Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {registeredEvents.length > 0 ? (
          registeredEvents.map((event) => (
            <div
              key={event._id}
              className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => navigate(`/admin/events/${event._id}`)} // Re-using admin event details route
            >
              {event.photo && (
                <img
                  src={`http://localhost:5000${event.photo}`}
                  alt={event.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <p className="text-sm text-gray-600">{new Date(event.time).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Location: {event.location}</p>
            </div>
          ))
        ) : (
          <p>You haven't registered for any events yet.</p>
        )}
      </div>
    </div>
  );
}
