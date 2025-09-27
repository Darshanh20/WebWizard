import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { API } from "../api";

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin"); // Placeholder for admin's name
  const [recentEvents, setRecentEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

    // Close sidebar whenever the route changes (helps on small screens so nav closes the drawer)
    useEffect(() => {
      setSidebarOpen(false);
    }, [location.pathname]);

    // Close the sidebar when any internal link is clicked (capture phase) on small screens.
    useEffect(() => {
      const onDocClick = (e) => {
        const a = e.target.closest && e.target.closest('a');
        if (!a) return;
        // Close for any anchor click (covers react-router Link and nested elements)
        setSidebarOpen(false);
      };

      const onKey = (e) => {
        if (e.key === 'Escape' && window.innerWidth < 768) setSidebarOpen(false);
      };

      const onPop = () => {
        // handle browser back/forward
        if (window.innerWidth < 768) setSidebarOpen(false);
      };

      document.addEventListener('click', onDocClick, true); // capture
      window.addEventListener('popstate', onPop);
      window.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('click', onDocClick, true);
        window.removeEventListener('popstate', onPop);
        window.removeEventListener('keydown', onKey);
      };
    }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Build breadcrumb segments from the current location
  const breadcrumbNameMap = {
    admin: "Admin",
    events: "Events",
    add: "Add Event",
    manage: "Manage Events",
  };

  const buildBreadcrumbs = () => {
    const raw = location.pathname.replace(/^\//, '').split('/').filter(Boolean);
    const crumbs = [];
    raw.forEach((seg, idx) => {
      // default target path for this segment
      let to = '/' + raw.slice(0, idx + 1).join('/');
      // Special-case: when inside /admin/events, point the 'events' crumb to the manage page
      if (raw[0] === 'admin' && seg === 'events') {
        to = '/admin/events/manage';
      }
      const name = breadcrumbNameMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
      crumbs.push({ name, to });
    });
    // If empty (root /admin), show Admin
    if (crumbs.length === 0 && location.pathname === '/admin') {
      crumbs.push({ name: 'Admin', to: '/admin' });
    }
    return crumbs;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
  <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white flex flex-col transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200`}>
        <div className="p-4 text-2xl font-bold">Admin Panel</div>
        <nav className="flex-1" onClick={(e) => { if (e.target.closest && e.target.closest('a')) setSidebarOpen(false); }}>
          <Link to="/admin" className="block p-4 hover:bg-gray-700">Dashboard</Link>
          <div className="border-t border-gray-700 mt-2 pt-2">
            <span className="block p-4 text-gray-400">Events</span>
            <Link to="/admin/events/add" className="block pl-8 py-2 hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>Add Event</Link>
            <Link to="/admin/events/manage" className="block pl-8 py-2 hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>Manage Events</Link>
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

      {/* Backdrop (sibling of sidebar so stacking works reliably) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
  <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex justify-between items-center p-4 bg-white shadow-md">
          <div className="flex items-center space-x-3">
            <button
              className="p-2 rounded hover:bg-gray-200"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {adminName}</span>
          </div>
        </header>
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-2 text-sm text-gray-600">
            {(() => {
              const crumbs = buildBreadcrumbs();
              return crumbs.map((c, i) => (
                <span key={c.to} className="inline-block">
                  {i < crumbs.length - 1 ? (
                    <>
                      <Link to={c.to} className="text-blue-600 hover:underline">{c.name}</Link>
                      <span className="mx-2">/</span>
                    </>
                  ) : (
                    <span className="text-gray-800">{c.name}</span>
                  )}
                </span>
              ));
            })()}
          </div>
        </div>

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
