import mongoose from 'mongoose';

const noteSchema = mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const leadSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
    },
    budget: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ['Facebook', 'Google', 'Referral', 'Direct', 'Instagram', 'Other'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Closed', 'Lost'],
      default: 'New',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: [noteSchema],
    lastContactedAt: Date,
    nextFollowUp: Date,
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 🔍 Full-text search
leadSchema.index({ name: 'text', phone: 'text', email: 'text' });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;