import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin"); // Placeholder for admin's name
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setAdminName(storedEmail.split('@')[0]); // Extract name from email as a placeholder
    }
  }, []);

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
          <Link to="/admin/events" className="block p-4 hover:bg-gray-700">Events</Link>
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
          <h1 className="text-xl font-semibold">Dashboard Overview</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {adminName}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
