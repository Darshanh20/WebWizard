import { useState } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function AddEvent() {
  const [form, setForm] = useState({
    name: "",
    location: "",
    time: "",
    maxCapacity: "",
    description: "",
  });
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

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
      await API.post("/events", formData, {
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" },
      });
      alert("Event added successfully!");
      setForm({
        name: "",
        location: "",
        time: "",
        maxCapacity: "",
        description: "",
      });
      setPhoto(null);
      navigate("/admin/events/manage"); // Redirect to manage events after adding
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to add event");
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Add New Event</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
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
            Add Event
          </button>
        </form>
      </div>
    </div>
  );
}
