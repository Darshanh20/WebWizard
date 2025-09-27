import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/login";
import Signup from "./pages/signup";
// import Homepage from "./pages/homepage"; // Homepage will no longer be the root element
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AddEvent from "./pages/AddEvent";
import ManageEvents from "./pages/ManageEvents";
import EditEvent from "./pages/EditEvent";
import EventDetails from "./pages/EventDetails";
import MyEvents from "./pages/MyEvents";
import AllStudentEvents from "./pages/AllStudentEvents";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    // No need to set them here, they are already initialized
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Root path redirects based on authentication and role */}
        <Route
          path="/"
          element={
            token ? (
              role === "admin" ? (
                <Navigate to="/admin" replace />
              ) : role === "student" ? (
                <Navigate to="/student" replace />
              ) : (
                <Navigate to="/login" replace /> // Fallback if role is unexpected but token exists
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Dashboard and nested routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="events/add" element={<AddEvent />} />
          <Route path="events/manage" element={<ManageEvents />} />
          <Route path="events/edit/:id" element={<EditEvent />} />
          <Route path="events/:id" element={<EventDetails />} />
        </Route>

        {/* Student Dashboard and nested routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<MyEvents />} />
          <Route path="all-events" element={<AllStudentEvents />} />
          <Route path="events/:id" element={<EventDetails />} />
        </Route>

        {/* Remove the /dashboard route as / handles initial redirection */}
        {/* <Route
          path="/dashboard"
          element={
            role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : role === "student" ? (
              <Navigate to="/student" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        /> */}
      </Routes>
    </Router>
  );
}

export default App;
