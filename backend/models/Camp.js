const mongoose = require('mongoose');

const campSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Camp name is required'],
      trim: true,
      maxlength: [150, 'Camp name cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Camp description is required'],
      trim: true,
      maxlength: [2000, 'Camp description cannot exceed 2000 characters']
    },
    date: {
      type: Date,
      required: [true, 'Camp date is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true
    },
    location: {
      venue: { type: String, required: [true, 'Venue name is required'], trim: true },
      address: { type: String, required: [true, 'Address is required'], trim: true },
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, required: [true, 'State is required'], trim: true, default: 'State' },
      pincode: { type: String, trim: true, default: '' }
    },
    specialties: {
      type: [String],
      required: [true, 'At least one medical specialty is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A camp must offer at least one medical specialty'
      }
    },
    services: {
      type: [String],
      required: [true, 'At least one service is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A camp must offer at least one medical service'
      }
    },
    organizer: {
      name: { type: String, required: [true, 'Organizer name is required'], trim: true },
      hospital: { type: String, trim: true, default: '' },
      contactPerson: { type: String, trim: true, default: '' }
    },
    contactInformation: {
      phone: { type: String, required: [true, 'Contact phone is required'], trim: true },
      email: { type: String, required: [true, 'Contact email is required'], trim: true, lowercase: true },
      helpline: { type: String, trim: true, default: '' }
    },
    capacity: {
      type: Number,
      required: [true, 'Registration capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    registrationCount: {
      type: Number,
      default: 0,
      min: [0, 'Registration count cannot be negative']
    },
    image: {
      type: String,
      default: '/images/camp-default.jpg'
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Upcoming'
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: remainingCapacity
campSchema.virtual('remainingCapacity').get(function () {
  return Math.max(0, this.capacity - (this.registrationCount || 0));
});

// Virtual: isFull
campSchema.virtual('isFull').get(function () {
  return (this.registrationCount || 0) >= this.capacity;
});

// Virtual: isOpen
campSchema.virtual('isOpen').get(function () {
  const isStatusOpen = this.status === 'Upcoming' || this.status === 'Ongoing';
  const hasCapacity = (this.registrationCount || 0) < this.capacity;
  const isNotPast = new Date(this.date).setHours(23, 59, 59, 999) >= Date.now();
  return isStatusOpen && hasCapacity && isNotPast && !this.isArchived;
});

// Virtual: formattedDate
campSchema.virtual('formattedDate').get(function () {
  if (!this.date) return '';
  return new Date(this.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual: fullLocation
campSchema.virtual('fullLocation').get(function () {
  if (!this.location) return '';
  const parts = [this.location.venue, this.location.address, this.location.city, this.location.state];
  return parts.filter(Boolean).join(', ');
});

// Indexes for fast searching and filtering
campSchema.index({ name: 'text', description: 'text', 'location.city': 'text', 'location.venue': 'text' });
campSchema.index({ date: 1 });
campSchema.index({ status: 1 });
campSchema.index({ specialties: 1 });
campSchema.index({ 'location.city': 1 });

const Camp = mongoose.model('Camp', campSchema);
module.exports = Camp;
