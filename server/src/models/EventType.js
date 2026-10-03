import mongoose from 'mongoose';

const eventTypeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  tamilName: { type: String },
  logo: { type: String }, // Base64 or URL
  description: { type: String },
  defaultVenue: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

eventTypeSchema.index({ userId: 1 });
eventTypeSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('EventType', eventTypeSchema);
