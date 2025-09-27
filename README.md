# 🎉 Event Management Platform

## 📌 Project Statement

Managing events at a university/college level often becomes complicated due to manual registrations, limited seats, and last-minute updates. This project automates the entire event lifecycle, from event creation (admin) to student registration and queue management.

The platform ensures that:
- Admins can create, manage, and track events.
- Students can discover, register, and track their participation in events.
- A queue system handles cases when events are full.

---

## 🚀 Features

### 👨‍💼 Admin Side
- 🔑 Admin Authentication (secure login).
- ➕ Add Events (title, description, date, capacity, image, etc.).
- 📝 Manage Events (edit, delete, or update details).
- 👥 See Registrations List for each event.
- ⏳ Waiting List Management (approve/reject students).
- 🛑 End Event and mark it as completed.
- 📊 Dashboard with insights (total events, active students, completed events).

### 🎓 Student Side
- 🔑 Student Authentication (signup/login).
- 📅 See Available Events with details.
- 📝 Register for Events (if seats available).
- ⏳ Auto Queue System (if event is full, student is added to waiting list).
- 🎟 View Registered Events (with status: Confirmed / In Queue).
- 📌 Event Details Page with full description.

---

## 🛠 Tech Stack

### Frontend
- ⚛ React.js (UI and routing)
- 🎨 Tailwind CSS (responsive minimal UI)
- 🔄 Axios (backend communication)
- 🖼 Cloudinary (optional for image uploads)

### Backend
- 🟢 Node.js (runtime)
- 🚂 Express.js (web framework)
- 🛡 JWT Authentication (secure login)

### Database
- 🍃 MongoDB Atlas (cloud-hosted)
- 📦 Mongoose ORM

### Other Tools
- 🌩 Supabase / Firebase (Optional for auth or storage)
- 🛠 Postman (API testing)
- 🚀 Vercel / Netlify (frontend deployment)
- ☁ Render / Railway (backend deployment)

---

## 🏗 Data Flow

1. Authentication Flow

User (admin/student) → Signup/Login → JWT Token issued → Stored in localStorage → Used in protected routes.

2. Event Creation & Management

Admin → Create Event → Data saved in MongoDB → Event visible on Student side.

Admin → Update/Delete Event → Database updated → Student side auto-updates.

3. Student Registration Flow

Student selects event → Check seat availability:
- ✅ If seats available → Student registered.
- ❌ If full → Student added to waiting list.

4. Queue Handling

When a registered student cancels/drops → Next student from waiting list is auto-promoted.

5. Event Completion Flow

Admin ends event → Status updated → No new registrations allowed.

---

## 📂 Folder Structure (example)

```
event-management-platform/
│── backend/
│   ├── index.js (or server.js)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   └── admin.js
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   └── middleware/
│       ├── auth.js
│       └── ...
│
│── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AddEvent.jsx
│   │   │   ├── ManageEvents.jsx
│   │   │   ├── EventDetails.jsx
│   │   │   ├── signup.jsx
│   │   │   └── login.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── EventCard.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── main.jsx
│
│── README.md
│── package.json
│── tailwind.config.js
```

---

## 📊 Database Schema (example)

### User
```json
{
	"name": "string",
	"email": "string (unique)",
	"password": "string (hashed)",
	"role": "admin | student"
}
```

### Event
```json
{
	"title": "string",
	"description": "string",
	"date": "Date",
	"capacity": "number",
	"registeredCount": "number",
	"imageUrl": "string",
	"status": "active | completed"
}
```

### Registration
```json
{
	"eventId": "ObjectId",
	"studentId": "ObjectId",
	"status": "confirmed | waiting"
}
```

---

## ⚙ Installation & Setup

1. Clone the Repository

```bash
git clone https://github.com/your-username/event-management-platform.git
cd event-management-platform
```

2. Install Dependencies

Backend

```bash
cd backend
npm install
```

Frontend

```bash
cd frontend
npm install
```

3. Setup Environment Variables

Create `.env` file in `backend/` with:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_URL=your_cloudinary_url
PORT=5000
```

4. Run the Project

```bash
# Run backend
cd backend
npm start

# Run frontend
cd frontend
npm run dev
```

---

## 📸 Screenshots (optional)

- Admin Dashboard
- Manage Events Page
- Student Registration Page
- Event Details Page

---

## 🔮 Future Enhancements

- 📱 Mobile App (React Native / Flutter).
- 🔔 Email & SMS Notifications.
- 📊 Analytics Dashboard with charts.
- 🤝 Collaboration Events (multiple admins).
- 🎥 Event Recording Uploads.

---

## Team Members

- Darshan Hotchandani –
- Krish Kamani -
---

If you'd like, I can also:
- Add a short "How to run locally" script for Windows (PowerShell) with example commands.
- Add deployment guides for Vercel + Render or Netlify + Railway.
- Add badges and a CONTRIBUTING.md or CODE_OF_CONDUCT.md.

Would you like any of those improvements added to the README now?
