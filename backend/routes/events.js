const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Files will be stored in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage: storage });

// Create a new event (Admin only)
router.post('/', auth, adminAuth, upload.single('photo'), async (req, res) => {
  try {
    const { name, location, time, maxCapacity, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

    const newEvent = new Event({
      name,
      location,
      time,
      photo,
      maxCapacity,
      description,
    });

    const event = await newEvent.save();
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ time: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get a single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('registrations', 'name email');
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update an event by ID (Admin only)
router.put('/:id', auth, adminAuth, upload.single('photo'), async (req, res) => {
  try {
    const { name, location, time, maxCapacity, description } = req.body;
    const updatedFields = { name, location, time, maxCapacity, description };

    if (req.file) {
      updatedFields.photo = `/uploads/${req.file.filename}`;
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete an event by ID (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Register for an event (Student only)
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    if (req.role !== 'student') {
      return res.status(403).json({ msg: 'Access denied. Only students can register for events.' });
    }

    // Check if user is already registered
    if (event.registrations.includes(req.user)) {
      return res.status(400).json({ msg: 'You are already registered for this event.' });
    }

    // Check if event is full
    if (event.registrations.length >= event.maxCapacity) {
      return res.status(400).json({ msg: 'Event is full.' });
    }

    event.registrations.push(req.user);
    await event.save();
    res.status(200).json({ msg: 'Successfully registered for the event.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Unregister from an event (Student only)
router.post('/:id/unregister', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    if (req.role !== 'student') {
      return res.status(403).json({ msg: 'Access denied. Only students can unregister from events.' });
    }

    // Check if user is registered
    if (!event.registrations.includes(req.user)) {
      return res.status(400).json({ msg: 'You are not registered for this event.' });
    }

    event.registrations = event.registrations.filter(regId => regId.toString() !== req.user.toString());
    await event.save();
    res.status(200).json({ msg: 'Successfully unregistered from the event.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// End an event (Admin only)
router.put('/:id/end', auth, adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    event.isEnded = true;
    await event.save();
    res.status(200).json({ msg: 'Event ended successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
