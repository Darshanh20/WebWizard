import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../api";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const storedUserId = localStorage.getItem("id"); // Assuming you store user ID in local storage
    setUserRole(role);
    setUserId(storedUserId);

    const fetchEvent = async () => {
      try {
        const { data } = await API.get(`/events/${id}`);
        setEvent(data);
        setIsRegistered(data.registrations.some(reg => reg._id === storedUserId));
        setLoading(false);
      } catch (err) {
        setError("Failed to load event details.");
        setLoading(false);
        console.error(err);
      }
    };
    fetchEvent();
  }, [id, userId]);

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.post(`/events/${id}/register`, {}, { headers: { "x-auth-token": token } });
      alert("Successfully registered for the event!");
      setIsRegistered(true);
      // Re-fetch event to update registration count and list
      const { data } = await API.get(`/events/${id}`);
      setEvent(data);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to register for event.");
      console.error(err);
    }
  };

  const handleUnregister = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.post(`/events/${id}/unregister`, {}, { headers: { "x-auth-token": token } });
      alert("Successfully unregistered from the event!");
      setIsRegistered(false);
      // Re-fetch event to update registration count and list
      const { data } = await API.get(`/events/${id}`);
      setEvent(data);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to unregister from event.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Loading Event...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Error: {error}</h1>
        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Go Back</button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Event Not Found</h1>
        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Go Back</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Event Details: {event.name}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        {event.photo && (
          <img
            src={`http://localhost:5000${event.photo}`}
            alt={event.name}
            className="w-full h-64 object-cover rounded-md mb-4"
          />
        )}
        <p className="text-lg mb-2"><strong>Location:</strong> {event.location}</p>
        <p className="text-lg mb-2"><strong>Time:</strong> {new Date(event.time).toLocaleString()}</p>
        <p className="text-lg mb-2"><strong>Max Capacity:</strong> {event.maxCapacity}</p>
        <p className="text-lg mb-4"><strong>Description:</strong> {event.description}</p>

        <h2 className="text-2xl font-semibold mb-4">Registered Students ({event.registrations.length}/{event.maxCapacity})</h2>
        {
          event.registrations.length > 0 ? (
            <ul className="list-disc pl-5 mb-4">
              {event.registrations.map((student) => (
                <li key={student._id} className="text-gray-700">{student.name} ({student.email})</li>
              ))}
            </ul>
          ) : (
            <p className="mb-4">No students registered yet.</p>
          )
        }

        {userRole === "student" && (
          <button
            onClick={handleRegister}
            disabled={isRegistered || event.registrations.length >= event.maxCapacity || event.isEnded}
            className={`bg-green-600 text-white p-2 rounded hover:bg-green-700 mt-4 ${isRegistered || event.registrations.length >= event.maxCapacity || event.isEnded ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRegistered ? "Registered" : (event.registrations.length >= event.maxCapacity ? "Event Full" : (event.isEnded ? "Event Ended" : "Register for Event"))}
          </button>
        )}

        {userRole === "student" && isRegistered && (
          <button
            onClick={handleUnregister}
            className="bg-red-600 text-white p-2 rounded hover:bg-red-700 mt-4 ml-2"
          >
            Unregister
          </button>
        )}

        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-4">
          Go Back
        </button>
      </div>
    </div>
  );
}
