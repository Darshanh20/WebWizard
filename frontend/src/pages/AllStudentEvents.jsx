import { useState, useEffect } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function AllStudentEvents() {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("id");

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const { data } = await API.get("/events");
        setAllEvents(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch all events.");
        setLoading(false);
        console.error(err);
      }
    };
    fetchAllEvents();
  }, [userId, navigate]); // Add userId and navigate to dependency array

  if (loading) {
    return <div className="text-center py-4">Loading all events...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">All Available Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allEvents.length > 0 ? (
          allEvents.map((event) => {
            const isRegistered = event.registrations.some(reg => reg._id === userId);
            return (
              <div
                key={event._id}
                className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200 relative"
                onClick={() => navigate(`/student/events/${event._id}`)}
              >
                {isRegistered && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Registered
                  </span>
                )}
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
                <p className="text-sm text-gray-600">Capacity: {event.maxCapacity}</p>
                <p className="text-sm text-gray-600">Remaining Seats: {event.maxCapacity - event.registrations.length}</p>
              </div>
            );
          })
        ) : (
          <p>No available events found.</p>
        )}
      </div>
    </div>
  );
}
