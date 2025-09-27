import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

export default function Homepage() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const storedUser = {
          id: localStorage.getItem("id"),
          name: "User", // Placeholder
          email: localStorage.getItem("email") || "user@example.com", // Use stored email or placeholder
          role: localStorage.getItem("role"),
        };
        setUser(storedUser);

        const { data: eventsData } = await API.get("/events");
        setEvents(eventsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        localStorage.clear();
        navigate("/login");
      }
    };
    fetchUserAndEvents();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <h2 className="text-2xl font-bold">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h2>
      <p className="text-lg mb-2">Email: {user.email}</p>
      <p className="text-lg mb-4">Role: {user.role}</p>

      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event._id}
              className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => navigate(`/admin/events/${event._id}`)} // Re-using admin event details route for now
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
              <p className="text-sm text-gray-600">Capacity: {event.maxCapacity}</p>
              <p className="text-sm text-gray-600">Registered: {event.registrations ? event.registrations.length : 0}</p>
            </div>
          ))
        ) : (
          <p>No upcoming events found.</p>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-600 text-white rounded p-2 hover:bg-red-700 mt-8"
      >
        Logout
      </button>
    </div>
  );
}
