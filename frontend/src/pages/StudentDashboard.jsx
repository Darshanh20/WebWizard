import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";

export default function StudentDashboard() {
  const [studentName, setStudentName] = useState("Student"); // Placeholder for student's name
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setStudentName(storedEmail.split('@')[0]); // Extract name from email as a placeholder
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold">
          Welcome, {studentName} 
        </div>
        <nav className="flex-1">
          <Link to="/student" className="block p-4 hover:bg-gray-700">My Events</Link>
          <Link to="/student/all-events" className="block p-4 hover:bg-gray-700">All Available Events</Link>
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
