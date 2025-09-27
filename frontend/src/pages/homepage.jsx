import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

export default function Homepage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        // In a real app, you'd verify the token with the backend
        // and fetch user data based on the token.
        // For now, we'll just decode the token or use stored user data.
        const storedUser = {
          id: "123", // Placeholder
          name: "User", // Placeholder
          email: localStorage.getItem("email") || "user@example.com", // Use stored email or placeholder
          role: localStorage.getItem("role"),
        };
        setUser(storedUser);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        localStorage.clear();
        navigate("/login");
      }
    };
    fetchUser();
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
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white rounded p-2 hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
