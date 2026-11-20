const mongoose = require('mongoose');
const crypto = require('crypto');

const registrationSchema = new mongoose.Schema(
  {
    registrationReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [1, 'Age must be at least 1 year'],
      max: [120, 'Age cannot exceed 120 years']
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say'
    },
    address: {
      type: String,
      required: [true, 'City or residential address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters']
    },
    campId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camp',
      required: [true, 'A valid medical camp must be selected'],
      index: true
    },
    reasonForParticipation: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      default: ''
    },
    consent: {
      type: Boolean,
      required: [true, 'Consent is required to register'],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message: 'You must provide consent to register for the medical camp'
      }
    },
    registrationStatus: {
      type: String,
      enum: ['Confirmed', 'Attended', 'Cancelled'],
      default: 'Confirmed',
      index: true
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Method to generate unique reference code: e.g. MCR-2026-X9K2L1
registrationSchema.statics.generateReference = function () {
  const year = new Date().getFullYear();
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `MCR-${year}-${randomChars}`;
};

// Compound index to help query duplicate active registrations
registrationSchema.index({ campId: 1, email: 1, registrationStatus: 1 });
registrationSchema.index({ campId: 1, contactNumber: 1, registrationStatus: 1 });

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
