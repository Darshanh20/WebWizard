import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { API } from "../api";

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin"); // Placeholder for admin's name
  const [recentEvents, setRecentEvents] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setAdminName(storedEmail.split('@')[0]); // Extract name from email as a placeholder
    }

    // Only fetch recent events when on the main admin dashboard path
    if (location.pathname === "/admin") {
      const fetchRecentEvents = async () => {
        try {
          const { data } = await API.get("/events");
          setRecentEvents(data.slice(0, 5)); // Get top 5 recent events
        } catch (err) {
          console.error("Failed to fetch recent events:", err);
        }
      };
      fetchRecentEvents();
    }
  }, [location.pathname]); // Re-run effect when pathname changes

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold">Admin Panel</div>
        <nav className="flex-1">
          <Link to="/admin" className="block p-4 hover:bg-gray-700">Dashboard</Link>
          <div className="border-t border-gray-700 mt-2 pt-2">
            <span className="block p-4 text-gray-400">Events</span>
            <Link to="/admin/events/add" className="block pl-8 py-2 hover:bg-gray-700">Add Event</Link>
            <Link to="/admin/events/manage" className="block pl-8 py-2 hover:bg-gray-700">Manage Events</Link>
          </div>
        </nav>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white rounded p-2 hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex justify-between items-center p-4 bg-white shadow-md">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {adminName}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
          <div className="container mx-auto">
            {location.pathname === "/admin" ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Recent Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentEvents.length > 0 ? (
                    recentEvents.map((event) => (
                      <div
                        key={event._id}
                        className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
                        onClick={() => navigate(`/admin/events/${event._id}`)}
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
                        <p className="text-sm text-gray-600">Registered Students: {event.registrations ? event.registrations.length : 0}</p>
                      </div>
                    ))
                  ) : (
                    <p>No recent events found.</p>
                  )}
                </div>
              </div>
            ) : null}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
