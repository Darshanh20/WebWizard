const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User'); // Import User model
const { auth, adminAuth } = require('../middleware/auth');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure Multer for file uploads - NO LONGER NEEDED FOR URL-BASED PHOTOS
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // Files will be stored in the 'uploads' directory
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
//   },
// });

// const upload = multer({ storage: storage });

// Create a new event (Admin only)
// Create event: supports multipart file upload (photo) OR a remote image URL (photoUrl).
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, location, time, maxCapacity, description, photoUrl } = req.body;
    let photo = undefined;

    // If photoUrl is provided, attempt to fetch and save the image locally under /uploads
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.startsWith('http')) {
      try {
        // only accept http/https and basic image mime types
        const response = await axios.get(photoUrl, { responseType: 'arraybuffer', timeout: 10000 });
        const contentType = response.headers['content-type'] || '';
        if (!contentType.startsWith('image/')) {
          return res.status(400).json({ msg: 'Provided URL does not point to an image.' });
        }

        // ensure uploads dir exists
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext = contentType.split('/')[1].split(';')[0] || 'jpg';
        const filename = `${Date.now()}-${uuidv4()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, response.data);

        // store public path (served under /uploads)
        photo = `/uploads/${filename}`;
      } catch (fetchErr) {
        console.error('Failed to fetch remote image:', fetchErr.message || fetchErr);
        return res.status(400).json({ msg: 'Unable to fetch image from provided URL.' });
      }
    }

    // If multipart file upload handling is later added, prefer that; for now we accept photo from body or fetched file above
    if (!photo && req.file && req.file.path) {
      // multer would populate req.file.path; adapt if multer is reintroduced
      photo = `/${req.file.path.replace(/\\/g, '/')}`;
    }

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
    const events = await Event.find()
      .populate('registrations', 'name email')
      .populate('waitlist', 'name email') // Populate waitlist for student view
      .sort({ time: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get a single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registrations', 'name email phoneNumber')
      .populate('waitlist', 'name email phoneNumber');
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update an event by ID (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, location, time, maxCapacity, description, photoUrl } = req.body;
    
    // Find the event first to validate updates
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Validate maxCapacity
    if (maxCapacity !== undefined) {
      const newCapacity = parseInt(maxCapacity);
      if (isNaN(newCapacity) || newCapacity < 1) {
        return res.status(400).json({ msg: 'Capacity must be a positive number' });
      }
      if (newCapacity < existingEvent.registrations.length) {
        return res.status(400).json({ 
          msg: `Cannot set capacity below current number of registrations (${existingEvent.registrations.length})` 
        });
      }
    }

    // Prepare updated fields
    const updatedFields = { name, location, time, maxCapacity, description };
    
    // Remove undefined fields to avoid overwriting with null
    Object.keys(updatedFields).forEach(key => 
      updatedFields[key] === undefined && delete updatedFields[key]
    );

    // Use photoUrl if provided, otherwise leave existing photo unchanged
    if (photoUrl !== undefined) { // Check for explicit undefined to allow clearing photo
      updatedFields.photo = photoUrl;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id, 
      { $set: updatedFields },
      { new: true, runValidators: true }
    );
    
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

    if (event.isEnded) {
      return res.status(400).json({ msg: 'This event has ended.' });
    }

    // Update user's phone number if provided
    const { phoneNumber } = req.body;
    if (phoneNumber) {
      await User.findByIdAndUpdate(req.user, { phoneNumber });
    }

    // Check if user is already registered
    if (event.registrations.includes(req.user)) {
      return res.status(400).json({ msg: 'You are already registered for this event.' });
    }

    // Check if user is already on waitlist
    if (event.waitlist.includes(req.user)) {
      return res.status(400).json({ msg: 'You are already on the waitlist for this event.' });
    }

    // Check if event is full
    if (event.registrations.length >= event.maxCapacity) {
      event.waitlist.push(req.user);
      await event.save();
      return res.status(200).json({ msg: 'Event is full. You have been added to the waitlist.', waitlisted: true });
    }

    event.registrations.push(req.user);
    await event.save();
    res.status(200).json({ msg: 'Successfully registered for the event.', registered: true });

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

    // Check if user is registered or on waitlist
    if (!event.registrations.includes(req.user) && !event.waitlist.includes(req.user)) {
      return res.status(400).json({ msg: 'You are neither registered nor on the waitlist for this event.' });
    }

    let message = '';
    if (event.registrations.includes(req.user)) {
      event.registrations = event.registrations.filter(regId => regId.toString() !== req.user.toString());
      message = 'Successfully unregistered from the event.';

      // If there's someone on the waitlist and a spot opened up, promote them
      if (event.waitlist.length > 0 && event.registrations.length < event.maxCapacity) {
        const promotedUserId = event.waitlist.shift(); // Remove from waitlist
        event.registrations.push(promotedUserId); // Add to registrations
      }
    } else if (event.waitlist.includes(req.user)) {
      event.waitlist = event.waitlist.filter(waitId => waitId.toString() !== req.user.toString());
      message = 'Successfully left the waitlist.';
    }

    await event.save();
    res.status(200).json({ msg: message });

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
