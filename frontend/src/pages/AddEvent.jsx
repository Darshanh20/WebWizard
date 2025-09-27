import React, { useState, useRef, useEffect } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

function AddEvent() {
  console.log("AddEvent component rendered");
  useEffect(() => {
    console.log('AddEvent mounted');
  }, []);
  const [form, setForm] = useState({
    name: "",
    location: "",
    time: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    coordinator: "",
    maxCapacity: "",
    description: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoUrlInputOpen, setPhotoUrlInputOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "" });
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`handleChange: ${name}, ${value}`);
    setForm((f) => {
      console.log("Previous form state:", f);
      const newState = { ...f, [name]: value };
      console.log("New form state:", newState);
      return newState;
    });
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateField = (key, value) => {
    let msg = "";
  if (["name", "location", "time", "maxCapacity", "startDate", "startTime", "coordinator"].includes(key)) {
      if (!value || String(value).trim() === "") {
        msg =
          key === "name"
            ? "Event Title is required"
            : key === "location"
            ? "Event Location is required"
            : key === "time" || key === "startDate" || key === "startTime"
            ? "Event Date & Time is required"
            : "Maximum Attendees is required";
      }
    }
    setErrors((s) => ({ ...s, [key]: msg }));
    return msg === "";
  };

  const handleBlur = (e) => {
    console.log(`handleBlur: ${e.target.name}, ${e.target.value}`);
    validateField(e.target.name, e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting form with state:", form);

    // validate required fields
    const v1 = validateField("name", form.name);
    const v2 = validateField("location", form.location);
    const vco = validateField("coordinator", form.coordinator);
    const v3a = validateField("startDate", form.startDate);
    const v3b = validateField("startTime", form.startTime);
    const v4 = validateField("maxCapacity", form.maxCapacity);
    if (!v1 || !v2 || !vco || !v3a || !v3b || !v4) {
      return;
    }

  const formData = new FormData();
    // compose legacy `time` field (start date + time) for backend compatibility
    const composedTime = form.startDate && form.startTime ? `${form.startDate}T${form.startTime}` : form.time;
    const payload = { ...form, time: composedTime };
    for (const key in payload) {
      // don't include intermediate start/end fields here; append endTime explicitly below
      if (["startDate", "startTime", "endDate", "endTime"].includes(key)) continue;
      formData.append(key, payload[key]);
    }
    // append endTime separately if provided (compose date+time)
    if (form.endDate && form.endTime) {
      formData.append("endTime", `${form.endDate}T${form.endTime}`);
    } else if (form.endTime) {
      formData.append("endTime", form.endTime);
    }
    if (photo) {
      formData.append("photo", photo);
    } else if (photoUrl) {
      // if user provided an external image URL, send it as photoUrl
      formData.append('photoUrl', photoUrl);
    }

    // build JSON payload equivalent for when we send photoUrl as JSON
    const payloadJson = {};
    for (const key in payload) {
      if (["startDate", "startTime", "endDate", "endTime"].includes(key)) continue;
      payloadJson[key] = payload[key];
    }
    if (form.endDate && form.endTime) {
      payloadJson.endTime = `${form.endDate}T${form.endTime}`;
    } else if (form.endTime) {
      payloadJson.endTime = form.endTime;
    }

    try {
      const token = localStorage.getItem("token");
      if (photoUrl && !photo) {
        // send JSON payload when using an external URL (backend will fetch and save)
        const jsonPayload = { ...payloadJson, photoUrl };
        await API.post("/events", jsonPayload, {
          headers: { "x-auth-token": token, "Content-Type": "application/json" },
        });
      } else {
        await API.post("/events", formData, {
          headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" },
        });
      }
  setToast({ show: true, message: "Event created successfully!" });
  setForm({ name: "", location: "", time: "", startDate: "", startTime: "", endDate: "", endTime: "", coordinator: "", maxCapacity: "", description: "" });
      setPhoto(null);
      setPreviewUrl(null);
      setErrors({});
      setTimeout(() => navigate("/admin/events/manage"), 900);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to add event");
      console.error(err);
    }
  };

  return (
    <ErrorBoundary>
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Add New Event</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Details Card */}
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Event Title"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded pl-3`}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Location *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    {/* map pin icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 8.05a7 7 0 119.9 0L10 18.414 5.05 8.05zM10 10a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="location"
                    placeholder="Event Location"
                    value={form.location}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full p-2 border ${errors.location ? "border-red-500" : "border-gray-300"} rounded pl-10`}
                  />
                </div>
                {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Coordinator *</label>
                <input
                  type="text"
                  name="coordinator"
                  placeholder="Event Coordinator"
                  value={form.coordinator}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-2 border ${errors.coordinator ? "border-red-500" : "border-gray-300"} rounded`}
                />
                {errors.coordinator && <p className="text-sm text-red-600 mt-1">{errors.coordinator}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Attendees *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    {/* users icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path fillRule="evenodd" d="M2 14s1-1 6-1 6 1 6 1v1H2v-1z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    type="number"
                    name="maxCapacity"
                    placeholder="Maximum Attendees"
                    value={form.maxCapacity}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full p-2 border ${errors.maxCapacity ? "border-red-500" : "border-gray-300"} rounded pl-10`}
                    min="1"
                  />
                </div>
                {errors.maxCapacity && <p className="text-sm text-red-600 mt-1">{errors.maxCapacity}</p>}
              </div>

              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date & Time *</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
                  <div>
                    <label className="text-xs text-gray-500">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      style={{ accentColor: "#2563eb" }}
                      className={`w-full p-2 border ${errors.startDate ? "border-red-500" : "border-gray-300"} rounded`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      style={{ accentColor: "#2563eb" }}
                      className={`w-full p-2 border ${errors.startTime ? "border-red-500" : "border-gray-300"} rounded`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      style={{ accentColor: "#2563eb" }}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      style={{ accentColor: "#2563eb" }}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                {(errors.startDate || errors.startTime) && (
                  <p className="text-sm text-red-600 mt-1">{errors.startDate || errors.startTime}</p>
                )}
              </div>

              
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Additional Info</h2>
            <div className="mt-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Description</label>
              <textarea
                name="description"
                placeholder="Event Description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded resize-y"
                rows="4"
              ></textarea>
            </div>
          </div>

          {/* Upload Banner Card */}
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Upload Banner</h2>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  setPhoto(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }
              }}
              className="border-2 border-dashed border-gray-300 rounded p-6 flex flex-col items-center justify-center text-center cursor-pointer"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="max-h-48 object-contain mb-3 rounded" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0016.586 6L13 2.414A2 2 0 0011.586 2H4z" />
                </svg>
              )}
              <p className="text-sm text-gray-600">Drag & drop an image here, or click to select</p>
              <p className="text-sm text-gray-500 mt-2">Upload Event Banner / Poster</p>
              <input
                ref={fileInputRef}
                type="file"
                name="photo"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setPhoto(file);
                    setPreviewUrl(URL.createObjectURL(file));
                    setPhotoUrl('');
                  }
                }}
                className="hidden"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPhotoUrlInputOpen(true)}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Use Image URL
              </button>
              {photoUrl && (
                <div className="flex items-center gap-2">
                  <img src={photoUrl} alt="url-preview" className="h-12 w-20 object-cover rounded border" />
                  <button type="button" onClick={() => { setPhotoUrl(''); setPreviewUrl(null); }} className="text-sm text-red-600">Remove</button>
                </div>
              )}
            </div>

            {/* Photo URL modal */}
            {photoUrlInputOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded shadow w-11/12 max-w-md">
                  <h3 className="font-semibold mb-2">Enter Image URL (open-source / public)</h3>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={photoUrl}
                    onChange={(e) => {
                      setPhotoUrl(e.target.value);
                      setPreviewUrl(e.target.value || null);
                      setPhoto(null);
                    }}
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setPhotoUrlInputOpen(false)} className="px-3 py-2 rounded border">Cancel</button>
                    <button
                      type="button"
                      onClick={() => setPhotoUrlInputOpen(false)}
                      className="px-3 py-2 bg-blue-600 text-white rounded"
                    >
                      Use URL
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 w-full md:w-auto flex-1"
            >
              Create Event
            </button>

            <button
              type="button"
              onClick={() => {
                  setForm({ name: "", location: "", time: "", startDate: "", startTime: "", endDate: "", endTime: "", coordinator: "", maxCapacity: "", description: "" });
                  setPhoto(null);
                  setPreviewUrl(null);
                  setErrors({});
                }}
              className="border border-gray-300 text-gray-700 py-3 px-4 rounded hover:bg-gray-100 w-full md:w-auto flex-1"
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>

      <Toast open={toast.show} message={toast.message} onClose={() => setToast({ show: false, message: "" })} />
    </div>
    </ErrorBoundary>
  );
}

// Stable ErrorBoundary outside the component to avoid remounting input handlers/focus when
// the component re-renders. This prevents the single-character typing/caret jump bug.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-semibold text-red-700">Something went wrong rendering the Add Event page.</h2>
          <pre className="text-sm text-gray-700 mt-2">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AddEventWithBoundary(props) {
  return (
    <ErrorBoundary>
      <AddEvent {...props} />
    </ErrorBoundary>
  );
}
