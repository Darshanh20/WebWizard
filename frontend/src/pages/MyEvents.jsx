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

  const handleUnregister = async (id) => {
    if (window.confirm("Are you sure you want to unregister from this event?")) {
      try {
        const token = localStorage.getItem("token");
        await API.post(`/events/${id}/unregister`, {}, { headers: { "x-auth-token": token } });
        fetchMyEvents(); // Refresh the list of events
      } catch (err) {
        alert(err.response?.data?.msg || "Failed to unregister from event.");
        console.error(err);
      }
    }
  };

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
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              {event.photo && (
                <img
                  src={`http://localhost:5000${event.photo}`}
                  alt={event.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              <h3
                className="text-lg font-semibold cursor-pointer text-blue-600 hover:underline mb-2"
                onClick={() => navigate(`/student/events/${event._id}`)}
              >
                {event.name}
              </h3>
              <p className="text-sm text-gray-600">Location: {event.location}</p>
              <p className="text-sm text-gray-600">Time: {new Date(event.time).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mb-4">Description: {event.description}</p>
              {!event.isEnded && (
                <button
                  onClick={() => handleUnregister(event._id)}
                  className="bg-red-600 text-white p-2 rounded hover:bg-red-700 w-full"
                >
                  Unregister
                </button>
              )}
              {event.isEnded && (
                <p className="text-red-500 text-sm mt-2">This event has ended.</p>
              )}
            </div>
          ))
        ) : (
          <p>You haven't registered for any events yet.</p>
        )}
      </div>
    </div>
  );
}
