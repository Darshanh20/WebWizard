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
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [userId, setUserId] = useState(null);
  const [studentPhoneNumber, setStudentPhoneNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    const storedUserId = localStorage.getItem("id");
    const storedEmail = localStorage.getItem("email");
    const storedName = localStorage.getItem("name"); // Assuming name is also stored

    setUserRole(role);
    setUserId(storedUserId);
    setStudentEmail(storedEmail || "");
    setStudentName(storedName || "");

    // Fetch user's phone number
    const fetchUserPhoneNumber = async () => {
      try {
        if (storedUserId) {
          const { data } = await API.get(`/auth/users/${storedUserId}`); // Corrected endpoint
          setStudentPhoneNumber(data.phoneNumber || "");
          setStudentName(data.name || storedName || ""); // Use fetched name, fallback to stored, then default
        }
      } catch (err) {
        console.error("Failed to fetch user phone number:", err);
      }
    };

    const fetchEvent = async () => {
      try {
        const { data } = await API.get(`/events/${id}`);
        setEvent(data);
        setIsRegistered(data.registrations.some(reg => reg._id === storedUserId));
        setIsOnWaitlist(data.waitlist.some(wait => wait._id === storedUserId));
        setLoading(false);
      } catch (err) {
        setError("Failed to load event details.");
        setLoading(false);
        console.error(err);
      }
    };
    fetchUserPhoneNumber();
    fetchEvent();
  }, [id, userId]);

  const handleRegister = async () => {
    if (studentPhoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    try { 
      const token = localStorage.getItem("token");
      const response = await API.post(`/events/${id}/register`, { phoneNumber: studentPhoneNumber }, { headers: { "x-auth-token": token } });

      if (response.data.registered) {
        alert("Successfully registered for the event!");
        setIsRegistered(true);
        setIsOnWaitlist(false);
      } else if (response.data.waitlisted) {
        alert("Event is full. You have been added to the waitlist!");
        setIsOnWaitlist(true);
        setIsRegistered(false);
      }
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
      // Correctly call the unregister endpoint
      const response = await API.post(`/events/${id}/unregister`, {}, { headers: { "x-auth-token": token } });

      // After successful unregistration, update state
      setIsRegistered(false);
      setIsOnWaitlist(false);
      alert(response.data.msg); // Use the message from the backend

      // Re-fetch event to update registration count and list
      const { data } = await API.get(`/events/${id}`);
      setEvent(data);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to unregister/leave waitlist.");
      console.error("Unregister error:", err);
    }
  };

  const remainingSeats = event ? event.maxCapacity - event.registrations.length : 0;

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

        {userRole === "admin" && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Registered Students ({event.registrations.length}/{event.maxCapacity})</h2>
            {
              event.registrations.length > 0 ? (
                <ul className="list-disc pl-5 mb-4">
                  {event.registrations.map((student) => (
                    <li key={student._id} className="text-gray-700">{student.name} ({student.email}) {student.phoneNumber && `- ${student.phoneNumber}`}</li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4">No students registered yet.</p>
              )
            }
          </>
        )}

        {userRole === "admin" && event.waitlist.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Waitlist ({event.waitlist.length})</h2>
            <ul className="list-disc pl-5 mb-4">
              {event.waitlist.map((waitlistedUser) => (
                <li key={waitlistedUser._id} className="text-gray-700">{waitlistedUser.name} ({waitlistedUser.email}) {waitlistedUser.phoneNumber && `- ${waitlistedUser.phoneNumber}`}</li>
              ))}
            </ul>
          </div>
        )}

        {userRole === "student" && !event.isEnded && (
          <div className="mt-6 p-6 border rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-md">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Register for this Event</h3>
            <p className="mb-3 text-gray-700">Remaining Seats: <span className="font-semibold">{remainingSeats > 0 ? remainingSeats : 0}</span></p>

            {remainingSeats <= 0 && !isRegistered && !isOnWaitlist && (
              <p className="mb-3 p-2 bg-yellow-100 text-yellow-800 rounded-md shadow-sm">
                Seats are full. You can join the waitlist.
              </p>
            )}

            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Your Name"
                value={studentName}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-200 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={studentEmail}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-200 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                value={studentPhoneNumber}
                onChange={(e) => setStudentPhoneNumber(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                required
                pattern="[0-9]{10}"
                title="Phone number must be 10 digits"
              />
            </div>

            {!isRegistered && !isOnWaitlist && (
              <button
                onClick={handleRegister}
                className={`w-full p-3 rounded-lg text-white font-semibold transition duration-300 
          ${remainingSeats > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
              >
                {remainingSeats > 0 ? "Register for Event" : "Join Waitlist"}
              </button>
            )}

            {isRegistered && (
              <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded-lg shadow-sm flex justify-between items-center">
                <span>You are registered!</span>
                <button onClick={handleUnregister} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">Unregister</button>
              </div>
            )}

            {isOnWaitlist && (
              <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg shadow-sm flex justify-between items-center">
                <span>
                  You are on the waitlist! (Position: {event.waitlist.findIndex(wait => wait._id === userId) + 1})
                </span>
                <button onClick={handleUnregister} className="bg-yellow-600 text-white p-2 rounded-lg hover:bg-yellow-700">
                  Leave Waitlist
                </button>
              </div>
            )}
          </div>
        )}


        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-4">
          Go Back
        </button>
      </div>
    </div>
  );
}
