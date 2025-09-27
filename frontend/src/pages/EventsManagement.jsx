import { useState, useEffect } from "react";
import { API } from "../api";

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    location: "",
    time: "",
    maxCapacity: "",
    description: "",
  });
  const [photo, setPhoto] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await API.get("/events");
      setEvents(data);
    } catch (err) {
      alert("Failed to fetch events");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in form) {
      formData.append(key, form[key]);
    }
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      const token = localStorage.getItem("token");
      if (editingEventId) {
        await API.put(`/events/${editingEventId}`, formData, {
          headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" },
        });
        alert("Event updated successfully!");
      } else {
        await API.post("/events", formData, {
          headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" },
        });
        alert("Event added successfully!");
      }
      setForm({
        name: "",
        location: "",
        time: "",
        maxCapacity: "",
        description: "",
      });
      setPhoto(null);
      setEditingEventId(null);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to save event");
      console.error(err);
    }
  };

  const handleEdit = (event) => {
    setForm({
      name: event.name,
      location: event.location,
      time: new Date(event.time).toISOString().slice(0, 16),
      maxCapacity: event.maxCapacity,
      description: event.description,
    });
    setEditingEventId(event._id);
    // Photo can't be pre-filled for security reasons, user has to re-upload if needed
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const token = localStorage.getItem("token");
        await API.delete(`/events/${id}`, { headers: { "x-auth-token": token } });
        alert("Event deleted successfully!");
        fetchEvents();
      } catch (err) {
        alert(err.response?.data?.msg || "Failed to delete event");
        console.error(err);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Events Management</h1>

      {/* Add/Edit Event Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">{editingEventId ? "Edit Event" : "Add New Event"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Event Name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="datetime-local"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="number"
            name="maxCapacity"
            placeholder="Max Capacity"
            value={form.maxCapacity}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded resize-y"
            rows="4"
            required
          ></textarea>
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 w-full"
          >
            {editingEventId ? "Update Event" : "Add Event"}
          </button>
          {editingEventId && (
            <button
              type="button"
              onClick={() => {
                setEditingEventId(null);
                setForm({
                  name: "",
                  location: "",
                  time: "",
                  maxCapacity: "",
                  description: "",
                });
                setPhoto(null);
              }}
              className="bg-gray-400 text-white p-2 rounded hover:bg-gray-500 w-full mt-2"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      {/* Existing Events List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Existing Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Photo</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Location</th>
                <th className="py-2 px-4 border-b text-left">Time</th>
                <th className="py-2 px-4 border-b text-left">Capacity</th>
                <th className="py-2 px-4 border-b text-left">Description</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    {event.photo ? (
                      <img src={`http://localhost:5000${event.photo}`} alt={event.name} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">No Photo</div>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">{event.name}</td>
                  <td className="py-2 px-4 border-b">{event.location}</td>
                  <td className="py-2 px-4 border-b">{new Date(event.time).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">{event.maxCapacity}</td>
                  <td className="py-2 px-4 border-b">{event.description}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEdit(event)}
                      className="bg-yellow-500 text-white p-1 rounded text-sm hover:bg-yellow-600 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="bg-red-500 text-white p-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
