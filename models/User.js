import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    default: null, // Optional, OTP as primary auth method
  },
  publicName: {
    type: String,
    default: 'کاربر جدید',
  },
  profileImage: {
    type: String,
    default: null,
  },
  province: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  capital: {
    type: Number,
    default: 10000, // Default capital for % calculations
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  verified: {
    type: Boolean,
    default: false, // Blue tick
  },
  privacySettings: {
    showCalendar: {
      type: Boolean,
      default: false,
    },
    showAchievements: {
      type: Boolean,
      default: true,
    },
    showActivities: {
      type: Boolean,
      default: true,
    },
    showSetups: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Indexes
UserSchema.index({ phone: 1 })
UserSchema.index({ createdAt: -1 })

export default mongoose.models.User || mongoose.model('User', UserSchema)
