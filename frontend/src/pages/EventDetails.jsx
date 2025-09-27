import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API, EventAPI } from "../api";

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
  const [listView, setListView] = useState("registrations"); // 'registrations' or 'waitlist'
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    maxCapacity: 0,
    description: ""
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // fetchEvent is defined here so it can be used by the effect and by UI (refresh)
  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data } = await EventAPI.getEvent(id);
      const safeData = {
        ...data,
        registrations: Array.isArray(data.registrations) ? data.registrations : [],
        waitlist: Array.isArray(data.waitlist) ? data.waitlist : [],
      };
      setEvent(safeData);
      setEditForm({
        maxCapacity: safeData.maxCapacity,
        description: safeData.description || ""
      });
      const storedUserId = localStorage.getItem("id");
      setIsRegistered(safeData.registrations.some((reg) => reg && reg._id === storedUserId));
      setIsOnWaitlist(safeData.waitlist.some((wait) => wait && wait._id === storedUserId));
      setLoading(false);
    } catch (err) {
      setError("Failed to load event details.");
      setLoading(false);
      console.error(err);
    }
  };

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
    fetchUserPhoneNumber();
    fetchEvent();
  }, [id]);

  // allow manual refresh from UI
  const refreshEvent = async () => {
    await fetchEvent();
  };

  // export registrations to CSV (Excel-friendly)
  const exportRegistrationsToCSV = () => {
    if (!event || !Array.isArray(event.registrations) || event.registrations.length === 0) {
      alert('No registered students to export.');
      return;
    }

    const headers = ['#', 'Name', 'Email', 'Phone'];
    const rows = event.registrations.map((s, i) => [i + 1, s.name || '', s.email || '', s.phoneNumber || '']);

    // build CSV, escape quotes
    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');

    // prepend BOM for Excel UTF-8
    const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nameSafe = (event.name || 'event').replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    a.download = `${nameSafe}_registrations.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await EventAPI.updateEvent(id, editForm);
      await fetchEvent(); // Refresh event data
      setIsEditing(false);
      alert('Event updated successfully!');
    } catch (err) {
      console.error('Failed to update event:', err);
      alert('Failed to update event. Please try again.');
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await EventAPI.deleteEvent(id);
      alert('Event deleted successfully!');
      navigate('/admin/events/manage'); // Redirect to events list after deletion
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (isEditing) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Edit Event</h2>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Capacity</label>
            <input
              type="number"
              value={editForm.maxCapacity}
              onChange={(e) => setEditForm({...editForm, maxCapacity: parseInt(e.target.value) || 0})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={event?.registrations?.length || 1}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Current registrations: {event?.registrations?.length || 0}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-ww"
              style={{ backgroundColor: 'white', color: 'var(--ww-deep)', border: '1px solid var(--ww-deep)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-ww"
              style={{ backgroundColor: 'var(--ww-mid)' }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Delete confirmation modal
  const DeleteConfirmation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
        <p className="mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="btn-ww"
            style={{ backgroundColor: 'white', color: 'var(--ww-deep)', border: '1px solid var(--ww-deep)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteEvent}
            className="btn-ww"
            style={{ backgroundColor: 'var(--ww-mid)' }}
          >
            Delete Event
          </button>
        </div>
      </div>
    </div>
  );

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
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Event Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl" style={{ fontSize: '105%' }}>
      {showDeleteConfirm && <DeleteConfirmation />}
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Event Details</h1>
          <p className="text-gray-600">Manage and view event information</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-ww flex items-center gap-1.5 px-4 py-2"
                style={{ backgroundColor: 'var(--ww-mid)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-ww flex items-center gap-1.5 px-4 py-2"
                style={{ backgroundColor: 'var(--ww-mid)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </>
          )}
          <button
            onClick={refreshEvent}
            disabled={loading}
            aria-label="Refresh event"
            className={`btn-ww flex items-center gap-1.5 px-4 py-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: 'var(--ww-mid)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn-ww flex items-center gap-1.5 px-4 py-2"
            style={{ backgroundColor: 'var(--ww-deep)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Event Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-md">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Event Image */}
            <div className="md:col-span-1">
              {event.photo ? (
                <div className="relative aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={event.photo.startsWith('http') ? event.photo : `http://localhost:5000${event.photo}`}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg aspect-w-16 aspect-h-9 flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="md:col-span-2">
              <div className="flex flex-col h-full">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{event.name}</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-800">{event.location || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium text-gray-800">
                        {event.time ? new Date(event.time).toLocaleString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Not scheduled'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-medium text-gray-800">
                        {event.registrations.length} of {event.maxCapacity} registered
                        {remainingSeats > 0 && (
                          <span className="text-green-600 text-sm ml-2">
                            ({remainingSeats} seats left)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Registrations Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setListView('registrations')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  listView === 'registrations'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Registered ({event.registrations.length})
              </button>
              <button
                onClick={() => setListView('waitlist')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  listView === 'waitlist'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Waiting List ({event.waitlist.length})
              </button>
            </div>
            
            <div className="flex-shrink-0">
              <button
                onClick={exportRegistrationsToCSV}
                disabled={!event || !Array.isArray(event.registrations) || event.registrations.length === 0}
                className={`btn-ww flex items-center gap-2 px-4 py-2 text-sm ${
                  !event || !Array.isArray(event.registrations) || event.registrations.length === 0
                    ? 'opacity-60 cursor-not-allowed'
                    : ''
                }`}
                style={{ backgroundColor: 'var(--ww-mid)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {listView === 'registrations' ? (
          <div className="overflow-x-auto shadow-sm rounded-lg">
            {event.registrations.length === 0 ? (
              <p className="text-sm text-gray-600">No registered students.</p>
            ) : (
              <table className="min-w-full table-auto" style={{ fontSize: '100%' }}>
                <thead>
                  <tr className="bg-white/90 border-b border-gray-200">
                    <th className="px-4 py-2 sticky top-0 text-left text-sm font-semibold text-gray-700">Sr. No.</th>
                    <th className="px-4 py-2 sticky top-0 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 sticky top-0 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-2 sticky top-0 text-left text-sm font-semibold text-gray-700">Phone</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {event.registrations.map((student, idx) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{idx + 1}</td>
                      <td className="px-4 py-2 text-sm">{student.name}</td>
                      <td className="px-4 py-2 text-sm">{student.email}</td>
                      <td className="px-4 py-2 text-sm">{student.phoneNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto shadow-sm rounded-lg">
            {event.waitlist.length === 0 ? (
              <p className="text-sm text-gray-600">No users on the waiting list.</p>
            ) : (
              <table className="min-w-full table-auto" style={{ fontSize: '100%' }}>
                <thead>
                  <tr className="bg-white/90 border-b border-gray-200">
                    <th className="px-4 py-2 sticky top-0 text-left text-sm font-semibold text-gray-700">Sr. No.</th>
                    <th className="px-4 py-2 sticky top-0 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 sticky top-0 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-2 sticky top-0 text-left text-sm font-semibold text-gray-700">Phone</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {event.waitlist.map((student, idx) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{idx + 1}</td>
                      <td className="px-4 py-2 text-sm">{student.name}</td>
                      <td className="px-4 py-2 text-sm">{student.email}</td>
                      <td className="px-4 py-2 text-sm">{student.phoneNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

        {userRole === "student" && !event.isEnded && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold mb-3">Register for this Event</h3>
            <p className="mb-2">Remaining Seats: {remainingSeats > 0 ? remainingSeats : 0}</p>
            {remainingSeats <= 0 && !isRegistered && !isOnWaitlist && (
              <p className="text-yellow-700 mb-2">Seats are full. You can join the waitlist.</p>
            )}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                value={studentName}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-200 cursor-not-allowed"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={studentEmail}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-200 cursor-not-allowed"
              />
              <input
                type="tel"
                placeholder="Phone Number (optional)"
                value={studentPhoneNumber}
                onChange={(e) => setStudentPhoneNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            {!isRegistered && !isOnWaitlist && (
              <button
                onClick={handleRegister}
                disabled={event.isEnded}
                className={`bg-green-600 text-white p-2 rounded hover:bg-green-700 w-full mt-4 ${event.isEnded ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {event.isEnded ? "Event Ended" : (remainingSeats > 0 ? "Register for Event" : "Join Waitlist")}
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
      </div>
    </div>
  );
}
