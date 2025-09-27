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
  const [listView, setListView] = useState("registrations");

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await API.get('/events/' + id);
      const data = res.data;
      const safeData = {
        ...data,
        registrations: Array.isArray(data.registrations) ? data.registrations : [],
        waitlist: Array.isArray(data.waitlist) ? data.waitlist : []
      };
      setEvent(safeData);
      const storedUserId = localStorage.getItem('id');
      setUserId(storedUserId);
      setIsRegistered(safeData.registrations.some(r => r && r._id === storedUserId));
      setIsOnWaitlist(safeData.waitlist.some(w => w && w._id === storedUserId));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load event details.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('role');
    const storedEmail = localStorage.getItem('email');
    const storedName = localStorage.getItem('name');
    setUserRole(role);
    setStudentEmail(storedEmail || '');
    setStudentName(storedName || '');

    const fetchPhone = async () => {
      try {
        const storedUserId = localStorage.getItem('id');
        if (storedUserId) {
          const r = await API.get('/auth/users/' + storedUserId);
          const user = r.data;
          setStudentPhoneNumber(user.phoneNumber || '');
          setStudentName(user.name || storedName || '');
        }
      } catch (e) {
        console.error('fetchPhone error', e);
      }
    };

    fetchPhone();
    fetchEvent();
  }, [id]);

  const refreshEvent = async () => { await fetchEvent(); };

  const exportRegistrationsToCSV = () => {
    if (!event || !Array.isArray(event.registrations) || event.registrations.length === 0) {
      alert('No registered students to export.');
      return;
    }

    const headers = ['#', 'Name', 'Email', 'Phone'];
    const rows = event.registrations.map((s, i) => [i + 1, s.name || '', s.email || '', s.phoneNumber || '']);
    const escape = (val) => '"' + String(val).replace(/"/g, '""') + '"';
    const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nameSafe = (event.name || 'event').replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    a.download = nameSafe + '_registrations.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegister = async () => {
    if (studentPhoneNumber && studentPhoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const r = await API.post('/events/' + id + '/register', { phoneNumber: studentPhoneNumber }, { headers: { 'x-auth-token': token } });
      if (r.data.registered) {
        alert('Successfully registered for the event!');
      } else if (r.data.waitlisted) {
        alert('Event is full. You have been added to the waitlist!');
      }
      await fetchEvent();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.msg || 'Failed to register for event.');
    }
  };

  const handleUnregister = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await API.post('/events/' + id + '/unregister', {}, { headers: { 'x-auth-token': token } });
      alert(r.data.msg || 'Unregistered');
      await fetchEvent();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.msg || 'Failed to unregister/leave waitlist.');
    }
  };

  const remainingSeats = event ? (event.maxCapacity - (event.registrations ? event.registrations.length : 0)) : 0;

  if (loading) return (
    <div className="container mx-auto p-4"><h1 className="text-3xl font-bold mb-6">Loading Event...</h1></div>
  );

  if (error) return (
    <div className="container mx-auto p-4"><h1 className="text-3xl font-bold mb-6">Error: {error}</h1>
      <div className="mt-4"><button onClick={() => navigate('/admin/events/manage')} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Go Back</button></div>
    </div>
  );

  if (!event) return (
    <div className="container mx-auto p-4"><h1 className="text-3xl font-bold mb-6">Event Not Found</h1>
      <div className="mt-4"><button onClick={() => navigate(-1)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Go Back</button></div>
    </div>
  );

  return (
    <div className="container mx-auto p-4" style={{ fontSize: '105%' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Event Details</h1>
        <div className="flex items-center gap-2">
          <button onClick={refreshEvent} disabled={loading} aria-label="Refresh event" className={"btn-ww " + (loading ? 'opacity-70 cursor-not-allowed' : '')}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          <button onClick={() => navigate(-1)} className="btn-ww" style={{ backgroundColor: '#2b6cb0' }}>Back</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {event.photo && <img src={(event.photo && event.photo.startsWith('http')) ? event.photo : 'http://localhost:5000' + event.photo} alt={event.name} className="w-full h-48 object-cover rounded-md" />}
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold mb-2">{event.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
              <div><span className="font-bold">Location:</span> {event.location || '-'}</div>
              <div><span className="font-bold">Time:</span> {event.time ? new Date(event.time).toLocaleString() : '-'}</div>
              <div><span className="font-bold">Max Capacity:</span> {event.maxCapacity}</div>
              <div><span className="font-bold">Registered:</span> {(event.registrations ? event.registrations.length : 0)}</div>
            </div>
            <div>
              <h3 className="font-bold mb-1">Description</h3>
              <p className="text-sm text-gray-700">{event.description || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setListView('registrations')} className={"px-3 py-2 rounded " + (listView === 'registrations' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}>Registered ({(event.registrations ? event.registrations.length : 0)})</button>
            <button onClick={() => setListView('waitlist')} className={"px-3 py-2 rounded " + (listView === 'waitlist' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}>Waiting List ({(event.waitlist ? event.waitlist.length : 0)})</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportRegistrationsToCSV} disabled={!event || !Array.isArray(event.registrations) || event.registrations.length === 0} className={"btn-ww " + ((!event || !Array.isArray(event.registrations) || event.registrations.length === 0) ? 'opacity-60 cursor-not-allowed' : '')}>Export CSV</button>
          </div>
        </div>

        {listView === 'registrations' ? (
          <div className="overflow-x-auto shadow-sm rounded-lg">
            {(!event.registrations || event.registrations.length === 0) ? (
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
                    <tr key={student._id || idx} className="hover:bg-gray-50">
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
            {(!event.waitlist || event.waitlist.length === 0) ? (
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
                    <tr key={student._id || idx} className="hover:bg-gray-50">
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

      {userRole === 'student' && !event.isEnded && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold mb-3">Register for this Event</h3>
          <p className="mb-2">Remaining Seats: {remainingSeats > 0 ? remainingSeats : 0}</p>
          {remainingSeats <= 0 && !isRegistered && !isOnWaitlist && (
            <p className="text-yellow-700 mb-2">Seats are full. You can join the waitlist.</p>
          )}

          <div className="space-y-3">
            <input type="text" placeholder="Your Name" value={studentName} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-200 cursor-not-allowed" />
            <input type="email" placeholder="Your Email" value={studentEmail} readOnly className="w-full p-2 border border-gray-300 rounded bg-gray-200 cursor-not-allowed" />
            <input type="tel" placeholder="Phone Number (optional)" value={studentPhoneNumber} onChange={e => setStudentPhoneNumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
          </div>

          {!isRegistered && !isOnWaitlist && (
            <button onClick={handleRegister} disabled={event.isEnded} className={"btn-ww w-full mt-4 " + (event.isEnded ? 'opacity-50 cursor-not-allowed' : '')} style={{ justifyContent: 'center' }}>{event.isEnded ? 'Event Ended' : (remainingSeats > 0 ? 'Register for Event' : 'Join Waitlist')}</button>
          )}

          {isRegistered && (
            <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded-lg shadow-sm flex justify-between items-center">
              <span>You are registered!</span>
              <button onClick={handleUnregister} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">Unregister</button>
            </div>
          )}

          {isOnWaitlist && (
            <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg shadow-sm flex justify-between items-center">
              <span>You are on the waitlist! (Position: {event.waitlist.findIndex(w => w._id === userId) + 1})</span>
              <button onClick={handleUnregister} className="bg-yellow-600 text-white p-2 rounded-lg hover:bg-yellow-700">Leave Waitlist</button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Go Back</button>
      </div>
    </div>
  );
}
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
  const [listView, setListView] = useState("registrations"); // 'registrations' or 'waitlist'

  // fetchEvent is defined here so it can be used by the effect and by UI (refresh)
  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/events/${id}`);
      const safeData = {
        ...data,
        registrations: Array.isArray(data.registrations) ? data.registrations : [],
        waitlist: Array.isArray(data.waitlist) ? data.waitlist : [],
      };
      setEvent(safeData);
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
  const escape = (val) => '"' + String(val).replace(/"/g, '""') + '"';
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
  <button onClick={() => navigate('/admin/events/manage')} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Go Back</button>
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
    <div className="container mx-auto p-4" style={{ fontSize: '105%' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Event Details</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshEvent}
            disabled={loading}
            aria-label="Refresh event"
            className={`px-3 py-2 rounded text-sm text-white ${loading ? 'bg-green-400 opacity-70 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className={`px-3 py-2 rounded text-sm text-white bg-blue-600 hover:bg-blue-700`}>
            Back
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {event.photo && (
              <img
                src={`http://localhost:5000${event.photo}`}
                alt={event.name}
                className="w-full h-48 object-cover rounded-md"
              />
            )}
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold mb-2">{event.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
              <div><span className="font-bold">Location:</span> {event.location || '-'}</div>
              <div><span className="font-bold">Time:</span> {event.time ? new Date(event.time).toLocaleString() : '-'}</div>
              <div><span className="font-bold">Max Capacity:</span> {event.maxCapacity}</div>
              <div><span className="font-bold">Registered:</span> {event.registrations.length}</div>
            </div>
            <div>
              <h3 className="font-bold mb-1">Description</h3>
              <p className="text-sm text-gray-700">{event.description || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setListView('registrations')}
              className={`px-3 py-2 rounded ${listView === 'registrations' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Registered ({event.registrations.length})
            </button>
            <button
              onClick={() => setListView('waitlist')}
              className={`px-3 py-2 rounded ${listView === 'waitlist' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Waiting List ({event.waitlist.length})
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportRegistrationsToCSV}
              disabled={!event || !Array.isArray(event.registrations) || event.registrations.length === 0}
              className={`px-3 py-2 rounded text-sm ${(!event || !Array.isArray(event.registrations) || event.registrations.length === 0) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
              Export CSV
            </button>
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
                className={`btn-ww w-full mt-4 ${event.isEnded ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ justifyContent: 'center' }}
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

        <div className="mt-4">
          <button onClick={() => navigate(-1)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
