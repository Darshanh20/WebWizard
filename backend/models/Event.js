const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  time: { type: Date, required: true },
  photo: { type: String }, // URL to the uploaded photo
  maxCapacity: { type: Number, required: true, min: 1 },
  description: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
